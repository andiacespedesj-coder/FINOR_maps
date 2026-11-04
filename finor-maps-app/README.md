# FINOR Maps: aplicación web y Android

La interfaz React consulta la API Django. Vite sirve la versión web y Capacitor
empaqueta el mismo código para Android.

## Desarrollo local

Para ver los cambios en el navegador con los datos del VPS, abre PowerShell en esta carpeta:

```powershell
npm.cmd run dev
```

Abre `http://127.0.0.1:5173/`. Vite actualiza la página al guardar archivos. Con **F12 → modo dispositivo** puedes verla con tamaño de teléfono. La API del VPS se consulta mediante el servidor de desarrollo; no necesitas iniciar Django ni generar un APK para revisar la interfaz. Los datos de la API no se guardan en caché durante el desarrollo, así que al recargar ves los cambios registrados en el panel.

Deja abierta la ventana de PowerShell donde ejecutaste Vite. Si `5173` está ocupado, Vite ahora se detiene con un mensaje claro; cierra el servidor anterior con **Ctrl+C** y vuelve a ejecutar `npm.cmd run dev`. Así no se crean servidores en `5174` o `5175` por accidente.

Si la página abre pero faltan datos, ejecuta `npm.cmd run check:dev` en otra ventana de PowerShell. La prueba arranca un servidor temporal, comprueba que React carga y verifica que el mapa recibe edificios y lugares del VPS. No modifica la base de datos.

Si aún no instalaste las dependencias, ejecuta `npm.cmd install` una vez. Para usar una API local en lugar del VPS, define `VITE_API_URL` antes de iniciar Vite.

Para comprobar el código:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run check:dev
```

## Organización de `src/`

- `pages/`: mapa, búsqueda, categorías, detalles e información. Los estilos de
  cada pantalla están junto a su archivo JSX.
- `components/`: mapa, navegación inferior e iconos compartidos.
- `services/httpClient.js`: URL de API, solicitudes y caché.
- `services/catalogApi.js`: rutas de la API del catálogo.
- `services/catalogData.js`: preparación de datos para búsqueda y detalles.
- `services/geolocation.js` y `mapCoordinates.js`: ubicación exterior y centro
  inicial del mapa.
- `legacy/`: pantalla GPS anterior, conservada como referencia y fuera de las
  rutas actuales.

La navegación paso a paso usa nodos y conexiones reales; las fotos con flechas
se vinculan a una conexión y a su sentido. Consulta [SPRINT_2.md](../SPRINT_2.md)
para la carga de datos y la demostración en el campus.

## Reportar un problema

La opción **Info → Reportar un problema** prepara un correo dirigido a
`andiacespedesj@gmail.com`, definido en `src/services/reporting.js`. El usuario
debe revisarlo y enviarlo desde su aplicación de correo. Si no tiene una app
de correo configurada, puede copiar el reporte. Los reportes no se guardan en
la base de datos ni se envían automáticamente desde Django.

## APK de prueba conectado al VPS

El archivo `.env.production` de esta carpeta define
`VITE_API_URL=https://162.35.162.131/api`. Vite incorpora esa dirección al APK;
si cambia el servidor, hay que generar e instalar un APK nuevo.

Desde esta carpeta, en PowerShell:

```powershell
npm.cmd run build
npx.cmd cap sync android
cd android
.\gradlew.bat assembleDebug
```

El APK de prueba queda en `android/app/build/outputs/apk/debug/app-debug.apk`.
Durante el trabajo diario, revisa los cambios con `npm.cmd run dev`; no hace falta
compilar Android ni aumentar `versionCode`. Aumenta la versión únicamente cuando
vayas a distribuir una nueva compilación de prueba o una entrega del sprint.
Para ofrecerlo desde el VPS, cópialo con PSCP al archivo
`/opt/finor-maps/FINOR_Maps.apk` y comprueba
`https://162.35.162.131/apk/`. Ese enlace está implementado por Django.
Esta compilación es de depuración y sirve para pruebas del equipo; una
distribución pública requiere una versión release firmada.
