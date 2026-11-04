# Publicar el admin FINOR en el VPS

Para actualizar la instalación existente a Sprint 2, consulta [SPRINT2_UPDATE.md](SPRINT2_UPDATE.md).

Esta guía corresponde al VPS Ubuntu 26.04 con IP `162.35.162.131`, Apache,
PostgreSQL 18 y PostGIS 3.6. Conserva el sitio `000-default.conf` existente.
Al terminar, el equipo podrá abrir `https://162.35.162.131/admin/`.
PostgreSQL seguirá escuchando solo localmente; no abras el puerto 5432.

## 1. Subir el paquete

En PowerShell de la PC, desde la raíz del proyecto:

```powershell
pscp.exe .\scratch\finor_backend_para_vps.tar.gz root@162.35.162.131:/root/finor_backend_para_vps.tar.gz
```

## 2. Instalar el backend

En PuTTY como `root`:

```bash
apt update
apt install -y python3-venv python3-pip gdal-bin libgdal-dev libgeos-dev snapd
mkdir -p /opt/finor-maps
tar -xzf /root/finor_backend_para_vps.tar.gz -C /opt/finor-maps
id finor >/dev/null 2>&1 || useradd --system --home-dir /opt/finor-maps --shell /usr/sbin/nologin finor
cd /opt/finor-maps
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements-production.txt
```

## 3. Configurar Django

```bash
cd /opt/finor-maps
cp deploy/server.env.example .env
.venv/bin/python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
nano .env
```

En `.env`, reemplaza `SECRET_KEY` por la clave que acaba de generar el comando
y `DB_PASSWORD` por la contraseña existente de `finor_app`. Escribe los valores
directamente en PuTTY. No los envíes por chat ni los guardes en Git.

```bash
chown root:finor .env
chmod 640 .env
install -d -o finor -g finor -m 755 media staticfiles
chown -R finor:finor media staticfiles
sudo -u finor .venv/bin/python manage.py check --deploy
sudo -u finor .venv/bin/python manage.py migrate --check
sudo -u finor .venv/bin/python manage.py collectstatic --noinput
```

Si `migrate --check` informa migraciones pendientes, detente y revisa cuáles
son antes de aplicarlas; este despliegue no reinicia ni borra la base.
`check --deploy` puede advertir sobre HSTS, que requiere evaluar primero
el uso de HTTPS.

## 4. Iniciar Gunicorn

```bash
cp deploy/finor.service /etc/systemd/system/finor.service
systemctl daemon-reload
systemctl enable --now finor
systemctl status finor --no-pager
curl -I http://127.0.0.1:8000/admin/
```

Gunicorn solo escucha en `127.0.0.1:8000`. Un `302` en la última comprobación
es normal porque Django exige HTTPS. Si el servicio falla, consulta
`journalctl -u finor -n 80 --no-pager`.

## 5. Preparar Apache y el certificado para la IP

Activa un sitio Apache específico para FINOR, sin desactivar `000-default.conf`:

```bash
mkdir -p /var/www/finor-certbot/.well-known/acme-challenge
cp deploy/apache-bootstrap.conf /etc/apache2/sites-available/finor.conf
a2ensite finor.conf
apache2ctl configtest
systemctl reload apache2
printf 'ok\n' > /var/www/finor-certbot/.well-known/acme-challenge/prueba
curl -fsS -H 'Host: 162.35.162.131' http://127.0.0.1/.well-known/acme-challenge/prueba
rm -f /var/www/finor-certbot/.well-known/acme-challenge/prueba
```

La respuesta de `curl` debe ser `ok`. El puerto 80 debe ser accesible desde Internet para emitir el
certificado. Abre también el puerto 443 en el firewall del proveedor/VPS.

Instala Certbot 5.4 o posterior desde Snap:

```bash
snap install --classic certbot
ln -s /snap/bin/certbot /usr/local/bin/certbot
certbot --version
```

Si el enlace ya existe, no repitas `ln -s`. Solicita el certificado para la IP:

```bash
certbot certonly --webroot --webroot-path /var/www/finor-certbot --preferred-profile shortlived --ip-address 162.35.162.131
```

Certbot solicitará un correo y la aceptación de sus términos. Debe informar
que guardó el certificado en
`/etc/letsencrypt/live/162.35.162.131/` antes de continuar.

## 6. Activar HTTPS y comprobar

```bash
a2enmod ssl proxy proxy_http headers rewrite
cp deploy/apache-https.conf /etc/apache2/sites-available/finor.conf
apache2ctl configtest
systemctl reload apache2
install -m 755 deploy/reload-apache.sh /etc/letsencrypt/renewal-hooks/deploy/reload-apache.sh
certbot renew --dry-run --run-deploy-hooks
curl -I https://162.35.162.131/admin/
```

Los certificados de IP de Let's Encrypt duran seis días; verifica que la
renovación automática y la recarga de Apache funcionen. En un navegador,
abre `https://162.35.162.131/admin/`, entra con una cuenta administradora
existente y comprueba CSS, mapa y fotos. Crea una cuenta `staff` individual
para cada integrante y asigna solo los permisos de los modelos que editará.
