# Actualizar el VPS para Sprint 2

Esta actualización conserva `.env`, las fotografías de `media/` y la base de datos existente. El archivo `scratch/finor_backend_sprint2.tar.gz` contiene solo código y la migración aditiva `0012_fotoruta_conexion`.

## 1. Subir el backend nuevo desde PowerShell

```powershell
pscp.exe "C:\Users\andia\Documents\FINOR_maps\scratch\finor_backend_sprint2.tar.gz" root@162.35.162.131:/root/finor_backend_sprint2.tar.gz
```

## 2. Respaldar la base y actualizar desde PuTTY

Ejecutar cada línea y esperar a que vuelva el prompt antes de seguir:

```bash
umask 077; runuser -u postgres -- pg_dump -Fc finor_maps_db > /root/finor_maps_antes_sprint2.dump
ls -lh /root/finor_maps_antes_sprint2.dump
tar -xzf /root/finor_backend_sprint2.tar.gz -C /opt/finor-maps
cd /opt/finor-maps
runuser -u finor -- .venv/bin/python manage.py migrate --plan
runuser -u finor -- .venv/bin/python manage.py migrate
runuser -u finor -- .venv/bin/python manage.py check
runuser -u finor -- .venv/bin/python manage.py collectstatic --noinput
systemctl restart finor
systemctl is-active finor
```

La migración agrega una relación opcional a las fotografías de ruta. No borra filas. Si cualquier comando falla, detenerse y revisar el error antes de reiniciar el servicio.

## 3. Subir el APK de prueba desde PowerShell

```powershell
pscp.exe "C:\Users\andia\Documents\FINOR_maps\finor-maps-app\android\app\build\outputs\apk\debug\app-debug.apk" root@162.35.162.131:/opt/finor-maps/FINOR_Maps.apk
```

En PuTTY:

```bash
chmod 644 /opt/finor-maps/FINOR_Maps.apk
curl -sSI https://162.35.162.131/apk/
```

En el teléfono, abrir `https://162.35.162.131/apk/` para descargar e instalar la versión de prueba actual. Es un APK `debug` para el equipo; no es una publicación de tienda. Para que HU-05 muestre una ruta real, cargar y revisar los puntos, conexiones y fotos descritos en `SPRINT_2.md`.
