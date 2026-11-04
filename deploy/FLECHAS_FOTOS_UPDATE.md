# Flechas interactivas en fotografías de ruta

El paquete `scratch/finor_backend_flechas.tar.gz` actualiza el panel y la API. Incluye las migraciones `0015` y `0016`. Conserva la base de datos, `.env` y `media/` existentes. El panel mostrará el editor de flechas después de aplicar esta actualización en el VPS.

## 1. Subir desde PowerShell en la PC

```powershell
pscp.exe "C:\Users\andia\Documents\FINOR_maps\scratch\finor_backend_flechas.tar.gz" root@162.35.162.131:/root/finor_backend_flechas.tar.gz
```

Espera a que `pscp` termine de transferir el archivo. Si muestra un error, no sigas con PuTTY.

## 2. Actualizar desde PuTTY

Ejecuta cada línea por separado. Si alguna falla, detente antes de continuar.

```bash
umask 077; runuser -u postgres -- pg_dump -Fc finor_maps_db > /root/finor_maps_antes_flechas.dump
ls -lh /root/finor_maps_antes_flechas.dump
tar -czf /root/finor_codigo_antes_flechas.tar.gz -C /opt/finor-maps FINOR_maps campus manage.py
ls -lh /root/finor_backend_flechas.tar.gz
tar -tzf /root/finor_backend_flechas.tar.gz | head -n 12
tar -xzf /root/finor_backend_flechas.tar.gz -C /opt/finor-maps
cd /opt/finor-maps
runuser -u finor -- .venv/bin/python manage.py migrate --plan
runuser -u finor -- .venv/bin/python manage.py migrate
runuser -u finor -- .venv/bin/python manage.py check
runuser -u finor -- .venv/bin/python manage.py collectstatic --noinput
systemctl restart finor
systemctl is-active finor
```

Si `migrate --plan` muestra otras migraciones pendientes además de `0015` y `0016`, revisa sus nombres antes de ejecutar `migrate`; el paquete contiene el código y las migraciones anteriores del proyecto. El resultado de `systemctl is-active finor` debe ser `active`.

Si `ls` o `tar` indica que `/root/finor_backend_flechas.tar.gz` no existe, vuelve al paso 1 en PowerShell. No continúes con `migrate`: sin el paquete instalado, no habrá migraciones nuevas.

## 3. Registrar flechas en el panel

1. En `https://162.35.162.131/admin/`, abre **Fotografías de ruta** y selecciona una foto existente. Si es una foto nueva, guárdala primero.
2. En **Flechas en esta foto**, elige la **Conexión** entre el nodo de la foto y el siguiente nodo. Elige **Dirección** y escribe una etiqueta breve si ayuda.
3. Selecciona esa fila y haz clic directamente sobre la foto para fijar la posición. Los campos X/Y se llenan automáticamente. Añade otras filas si la persona puede seguir varios caminos desde ese punto.
4. Pulsa **Guardar**. Abre la foto otra vez para comprobar que las flechas siguen en su lugar.

Cada flecha lleva a un nodo conectado. Para la vuelta, coloca otra flecha en la foto del nodo opuesto. La app muestra las flechas de la foto al iniciar una ruta hacia un destino; resalta la que sigue el camino calculado. La actualización de la app Android requiere compilar e instalar un APK nuevo, mientras que la carga de nuevas flechas después de eso solo requiere guardar en el panel.
