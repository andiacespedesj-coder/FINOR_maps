# Activar Decano y Vicedecano en el VPS

**Actualización posterior:** si ya aplicaste esta guía, continúa con [UNIDADES_FACULTAD_UPDATE.md](UNIDADES_FACULTAD_UPDATE.md). Esa corrección coloca Decanato y Vicedecanato en **Unidades de carrera** y sus cargos en **Responsables de unidades**.

El código local ya incluye `AutoridadFacultad`, su panel de administración, la API de lectura y la migración `0017`. La base de datos del VPS todavía no tiene la tabla. Este paquete actualiza solo el backend; conserva `.env`, `media/` y los registros existentes.

## 1. Subir el paquete desde PowerShell

```powershell
pscp.exe "C:\Users\andia\Documents\FINOR_maps\scratch\finor_backend_autoridades.tar.gz" root@162.35.162.131:/root/finor_backend_autoridades.tar.gz
```

Espera a que termine la transferencia. Si falla, no continúes en PuTTY.

## 2. Actualizar desde PuTTY

Ejecuta cada línea por separado. Si una falla, detente antes de seguir.

```bash
umask 077; runuser -u postgres -- pg_dump -Fc finor_maps_db > /root/finor_maps_antes_autoridades.dump
ls -lh /root/finor_maps_antes_autoridades.dump
tar -czf /root/finor_codigo_antes_autoridades.tar.gz -C /opt/finor-maps campus
ls -lh /root/finor_backend_autoridades.tar.gz
tar -tzf /root/finor_backend_autoridades.tar.gz
tar -xzf /root/finor_backend_autoridades.tar.gz -C /opt/finor-maps
cd /opt/finor-maps
runuser -u finor -- .venv/bin/python manage.py migrate campus --plan
runuser -u finor -- .venv/bin/python manage.py migrate campus 0017
runuser -u finor -- .venv/bin/python manage.py check
systemctl restart finor
systemctl is-active finor
curl -fsS https://162.35.162.131/api/autoridades-facultad/
```

El plan debe incluir `0017_autoridad_facultad`. Antes de registrar personas, la API debe responder `[]`. Si `migrate --plan` indica otras migraciones pendientes, revísalas antes de continuar. Si `ls` indica que el paquete no existe, vuelve al paso 1; sin código nuevo, `migrate` no encontrará `0017`.

## 3. Registrar los datos

En `https://162.35.162.131/admin/`, crea primero las **Personas**. Después, en **Autoridades de la facultad**, crea un registro para **Decano(a)** y otro para **Vicedecano(a)**. Selecciona FINOR como campus, la persona correspondiente y su horario de atención. La oficina es opcional. La app local mostrará los nombres y horarios en **Más opciones → Autoridades de FINOR**.
