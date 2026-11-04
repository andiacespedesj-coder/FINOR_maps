# Publicar FINOR Maps sin depender de una IP local

Para el VPS actual con acceso al admin mediante su IP, consulta
[deploy/README.md](deploy/README.md).

Un APK no debe conectarse a `192.168.x.x`: esa dirección solo existe en la red Wi-Fi de quien desarrolla. La solución estable es publicar Django en un dominio HTTPS y compilar el APK una vez con ese dominio.

## Arquitectura recomendada

```text
Teléfono / navegador
        │ HTTPS
        ▼
maps.finor.example  ──► Frontend React estático
        │
        └──────────────► api.finor.example/api/ ──► Django + PostgreSQL/PostGIS
                                                    └── media/ (planos y fotos)
```

El dominio es constante, por lo que los teléfonos no cambian de configuración al cambiar de red. El backend debe usar una base PostgreSQL administrada con PostGIS y copias de seguridad diarias.

## Variables de producción

1. Copiar `.env.production.example` como `.env` en el servidor Django y reemplazar todos los valores `example` y las credenciales. Conserva `http://localhost,https://localhost` en `CORS_ALLOWED_ORIGINS`: son los orígenes internos de Capacitor, no direcciones de la red local.
2. En `finor-maps-app`, copiar `.env.production.example` como `.env.production` y definir el dominio real, por ejemplo:

   ```env
   VITE_API_URL=https://api.finor.uagrm.edu.bo/api
   ```

3. Configurar DNS y certificados TLS para los dos dominios. Todos deben responder por HTTPS.
4. En el servidor ejecutar, antes de publicar:

   ```powershell
   .\venv\Scripts\Activate.ps1
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```

5. Generar el artefacto móvil:

   ```powershell
   cd finor-maps-app
   npm ci
   npm run build
   npx cap sync android
   ```

   Abrir `android` con Android Studio y generar el APK/AAB firmado de *release*.

## Desarrollo local

El navegador de la PC usa `http://localhost:8000/api`; no necesita IP. Para desarrollo en teléfono se puede usar un túnel HTTPS temporal, pero no debe emplearse para publicar el APK. El APK de producción solo usa `VITE_API_URL`.

### Base de datos en el VPS con Django en la PC

Actualmente PostgreSQL 18 y PostGIS están en el VPS, mientras Django y `media/`
siguen en la PC. No hace falta publicar el puerto 5432 de PostgreSQL. Antes de
iniciar Django, abre en PowerShell un túnel SSH con PuTTY/Plink y deja esa ventana
abierta:

```powershell
plink.exe -ssh -N -L 5433:127.0.0.1:5432 root@IP_DEL_VPS
```

Después de ingresar la contraseña SSH, Plink puede mostrar `Access granted.
Press Return to begin session`: pulsa Enter para activar el túnel. El `.env`
local de Django debe contener `DB_NAME=finor_maps_db`, `DB_USER=finor_app`,
`DB_HOST=127.0.0.1`, `DB_PORT=5433` y la contraseña de `finor_app` en
`DB_PASSWORD`. No agregues esa contraseña a Git ni a esta guía.

Comprueba la conexión antes de iniciar Django:

```powershell
.\venv\Scripts\python.exe manage.py migrate --check
```

Si cierras Plink, Django pierde acceso a la base hasta que abras de nuevo el
túnel. La app Android sigue necesitando una URL pública de Django para funcionar
fuera de la PC; mover solo PostgreSQL no publica la API ni las fotos.

## Operación y datos

- La API pública es de solo lectura. Las altas y correcciones se realizan desde `/admin/` con cuentas del personal autorizado.
- Ejecutar la migración `0005_data_integrity_and_indexes` después de comprobar que no existan códigos repetidos en un mismo piso. La migración evita que esos datos vuelvan a aparecer.
- El mapa se obtiene en una sola petición (`/api/modulos/mapa/`) y se conserva en el teléfono hasta 12 horas como respaldo offline.
- Respaldar PostgreSQL/PostGIS diariamente y verificar mensualmente una restauración. Guardar fotos y planos en almacenamiento persistente, no en el disco efímero de un servicio gratuito.

## Acceso del equipo mediante Cloudflare Tunnel

Para que el equipo cargue datos sin publicar la IP de la computadora, se puede
usar un subdominio exclusivo para el panel, por ejemplo
`https://admin.finor.tudominio.bo`.

1. En Cloudflare, cree un Tunnel llamado `finor-admin` e instale `cloudflared`
   como servicio en la computadora donde está Django.
2. Agregue una ruta de tipo **Published application** con el hostname elegido y
   el servicio local `http://localhost:8000`.
3. En Cloudflare Zero Trust cree una aplicación **Self-hosted** para ese mismo
   hostname. La política debe permitir únicamente los correos de los cinco
   integrantes del proyecto. Así el panel no queda abierto al público.
4. Después actualice las variables del servidor con el hostname real:

   ```env
   DEBUG=False
   ALLOWED_HOSTS=admin.finor.tudominio.bo
   CSRF_TRUSTED_ORIGINS=https://admin.finor.tudominio.bo
   ```

5. Reinicie el servicio Django y pruebe que cada integrante entra primero por
   Cloudflare Access y luego con su cuenta individual de Django Admin.

El token de Cloudflare Tunnel es secreto: no debe guardarse en el repositorio,
en archivos `.env.production.example` ni compartirse por chat. El túnel mantiene la URL
estable, pero la computadora, PostgreSQL y `cloudflared` deben permanecer
encendidos y con conexión a Internet. Para la publicación definitiva de la
app se recomienda mover Django y PostgreSQL a un servidor administrado.

## Lista de salida de beta

- [ ] Dominio HTTPS propio y certificado vigente.
- [ ] `DEBUG=False`, `SECRET_KEY` nueva y `ALLOWED_HOSTS` limitado.
- [ ] Base PostGIS con backups automáticos.
- [ ] APK firmado instalado y probado con Wi-Fi y datos móviles.
- [ ] Pruebas de GPS con permisos permitidos, denegados y señal débil.
- [ ] Verificación de planos, fotos, búsqueda y accesibilidad con al menos un teléfono Android de gama media.
