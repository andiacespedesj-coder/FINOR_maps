# Decano y Vicedecano en Responsables de unidades

**Actualización posterior:** usa [UNIDADES_FACULTAD_UPDATE.md](UNIDADES_FACULTAD_UPDATE.md). Incluye esta actualización y agrega Decanato y Vicedecanato a **Unidades de carrera**. Si ya aplicaste `0018`, la nueva guía continuará con `0019`.

Esta actualización continúa después de `0017_autoridad_facultad`, que ya se aplicó al VPS. Agrega **Decano(a)** y **Vicedecano(a)** al desplegable **Cargo** de **Responsables de unidades**. La migración `0018` traslada automáticamente los registros que se hayan cargado en **Autoridades de la facultad** y retira ese apartado duplicado. Conserva el resto de los datos, `.env` y `media/`.

## 1. Subir desde PowerShell en la PC

```powershell
pscp.exe "C:\Users\andia\Documents\FINOR_maps\scratch\finor_backend_responsables_v2.tar.gz" root@162.35.162.131:/root/finor_backend_responsables_v2.tar.gz
```

Espera a que termine. Si `pscp` falla, no continúes en PuTTY.

## 2. Actualizar desde PuTTY

Ejecuta cada línea por separado. Detente si una falla.

```bash
umask 077; runuser -u postgres -- pg_dump -Fc finor_maps_db > /root/finor_maps_antes_responsables_v2.dump
ls -lh /root/finor_maps_antes_responsables_v2.dump
tar -czf /root/finor_codigo_antes_responsables_v2.tar.gz -C /opt/finor-maps campus
ls -lh /root/finor_backend_responsables_v2.tar.gz
tar -tzf /root/finor_backend_responsables_v2.tar.gz
tar -xzf /root/finor_backend_responsables_v2.tar.gz -C /opt/finor-maps
cd /opt/finor-maps
runuser -u finor -- .venv/bin/python manage.py migrate campus --plan
runuser -u finor -- .venv/bin/python manage.py migrate campus 0018
runuser -u finor -- .venv/bin/python manage.py check
systemctl restart finor
systemctl is-active finor
curl -fsS https://162.35.162.131/api/autoridades-facultad/
```

El plan debe mostrar `0018_autoridades_en_responsables`. Si muestra otras migraciones pendientes, revísalas antes de migrar. Si el primer `curl` devuelve `503` justo tras reiniciar, espera unos segundos y repite solo el `curl`; si persiste, revisa `journalctl -u finor -n 80 --no-pager`.

## 3. Registrar en el panel

En `https://162.35.162.131/admin/`, abre **Responsables de unidades → Añadir**. Selecciona la persona y el cargo:

- **Director(a) de carrera** o **Ejecutivo(a) de centro interno**: selecciona **Unidad** y deja **Campus** vacío. El horario se toma de la unidad.
- **Decano(a)** o **Vicedecano(a)**: selecciona **Campus: FINOR** y deja **Unidad** vacía. Escribe el **Horario de atención**; la oficina es opcional.

Si ya habías registrado estas autoridades en el apartado anterior, busca sus nombres en **Responsables de unidades** antes de crear otros registros. La app muestra los cargos de facultad en **Más opciones → Autoridades de FINOR**.
