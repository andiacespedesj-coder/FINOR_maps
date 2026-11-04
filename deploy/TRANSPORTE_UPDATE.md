# Activar transporte en el VPS

El APK 1.9 ya muestra las líneas confirmadas aunque el VPS aún use la API anterior. Para administrar paradas y verlas en el mapa, hay que publicar el backend con las migraciones `0013` y `0014`. La migración crea las tablas de transporte y registra las líneas 5, 8, 10 y 22. No crea una parada con coordenadas aproximadas.

## 1. Subir el paquete desde PowerShell

```powershell
pscp.exe "C:\Users\andia\Documents\FINOR_maps\scratch\finor_backend_transporte.tar.gz" root@162.35.162.131:/root/finor_backend_transporte.tar.gz
```

## 2. Respaldar y actualizar en PuTTY

Ejecutar cada línea por separado y comprobar que termina sin error antes de seguir:

```bash
umask 077; runuser -u postgres -- pg_dump -Fc finor_maps_db > /root/finor_maps_antes_transporte.dump
ls -lh /root/finor_maps_antes_transporte.dump
tar -xzf /root/finor_backend_transporte.tar.gz -C /opt/finor-maps
cd /opt/finor-maps
runuser -u finor -- .venv/bin/python manage.py migrate --plan
runuser -u finor -- .venv/bin/python manage.py migrate
runuser -u finor -- .venv/bin/python manage.py check
systemctl restart finor
systemctl is-active finor
curl -fsS https://162.35.162.131/api/lineas-transporte/
```

La última respuesta debe contener cuatro líneas. El paquete no incluye `.env`, fotografías, archivos `media/` ni datos privados.

## 3. Registrar la parada real

En `https://162.35.162.131/admin/`, abrir **Paradas de transporte** y marcar en el mapa la esquina verificada. Asociar las cuatro líneas y activar **Publicada**. No usar una posición aproximada: los usuarios podrían caminar hacia el lugar equivocado.

Comprobar que `https://162.35.162.131/api/paradas-transporte/` devuelve la parada y que el APK la muestra en el mapa.
