# Decanato y Vicedecanato en Unidades de carrera

Este paquete actualiza el panel y la API para registrar **Decanato** y **Vicedecanato** como unidades de FINOR. Sus responsables se registran en **Responsables de unidades** con los cargos **Decano(a)** y **Vicedecano(a)**. Incluye las migraciones `0018` y `0019`: si `0018` ya se aplicó, solo se ejecutará `0019`. Las migraciones trasladan los datos existentes sin borrar personas, unidades de carrera, fotos ni lugares.

## 1. Subir desde PowerShell en la PC

```powershell
pscp.exe "C:\Users\andia\Documents\FINOR_maps\scratch\finor_backend_unidades_v3.tar.gz" root@162.35.162.131:/root/finor_backend_unidades_v3.tar.gz
```

Espera a que termine la transferencia. Si falla, no continúes en PuTTY.

## 2. Actualizar desde PuTTY

Ejecuta cada línea por separado. Si alguna falla, detente.

```bash
umask 077; runuser -u postgres -- pg_dump -Fc finor_maps_db > /root/finor_maps_antes_unidades_v3.dump
ls -lh /root/finor_maps_antes_unidades_v3.dump
tar -czf /root/finor_codigo_antes_unidades_v3.tar.gz -C /opt/finor-maps campus
ls -lh /root/finor_backend_unidades_v3.tar.gz
tar -tzf /root/finor_backend_unidades_v3.tar.gz
tar -xzf /root/finor_backend_unidades_v3.tar.gz -C /opt/finor-maps
cd /opt/finor-maps
runuser -u finor -- .venv/bin/python manage.py migrate campus --plan
runuser -u finor -- .venv/bin/python manage.py migrate campus 0019
runuser -u finor -- .venv/bin/python manage.py check
systemctl restart finor
systemctl is-active finor
curl -fsS https://162.35.162.131/api/autoridades-facultad/
```

El plan debe mostrar `0019_unidades_facultad` y, si aún no se aplicó, también `0018_autoridades_en_responsables`. Si muestra otras migraciones pendientes, revísalas antes de continuar. Si `curl` devuelve `503` justo después de reiniciar, espera unos segundos y repítelo; si persiste, revisa `journalctl -u finor -n 80 --no-pager`.

## 3. Registrar los datos en el panel

1. En **Unidades de carrera → Añadir**, crea **Decanato** con tipo **Decanato**, campus **FINOR**, carrera vacía, horario de atención y lugar opcional. Crea **Vicedecanato** de la misma forma.
2. En **Personas**, registra al Decano y al Vicedecano si todavía no existen.
3. En **Responsables de unidades → Añadir**, elige la persona, el cargo **Decano(a)** y la unidad **Decanato**. Repite con **Vicedecano(a)** y **Vicedecanato**.

Si ya habías registrado autoridades en el apartado anterior, revisa los registros antes de crear otros: la migración las vincula automáticamente a las nuevas unidades. La app local muestra sus nombres y horarios en **Más opciones → Autoridades de FINOR**; si se vincula una oficina como lugar, también pueden aparecer en la información de ese lugar.
