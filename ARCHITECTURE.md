# Estructura del proyecto

```text
FINOR_maps/
├─ FINOR_maps/                 Configuración Django, rutas raíz y descarga del APK
├─ campus/
│  ├─ domain/catalog.py       Campus, edificios, pisos, lugares y carreras
│  ├─ domain/navigation.py    Nodos, conexiones y fotografías de ruta
│  ├─ models.py               Entrada de modelos para Django y migraciones
│  ├─ api/catalog.py          Consultas públicas del catálogo
│  ├─ api/navigation.py       Consultas públicas de navegación
│  ├─ api/serializers/        Formato JSON del catálogo y navegación
│  ├─ admin.py                Registro y presentación del panel
│  ├─ admin_forms.py          Formularios específicos del panel
│  ├─ migrations/             Historia de la base de datos; no reordenar
│  └─ static/                 Recursos visuales del panel
├─ finor-maps-app/
│  ├─ src/pages/             Pantallas y sus estilos
│  ├─ src/components/        Elementos reutilizables
│  ├─ src/services/          HTTP, consultas, datos y GPS
│  ├─ src/legacy/            Antigua pantalla GPS, fuera de las rutas activas
│  └─ android/               Proyecto Capacitor/Android
└─ media/                    Fotos y planos cargados por el equipo
```

## Reglas para los próximos cambios

- Los modelos físicos van en `domain/catalog.py`; los de recorrido, en
  `domain/navigation.py`. `models.py` los importa para que Django los registre.
- Los endpoints y su formato JSON viven en `campus/api/`. La edición se realiza
  desde Django Admin, no desde la API pública.
- Las pantallas React presentan estados e interacciones. `catalogApi.js` define
  rutas HTTP, `httpClient.js` maneja transporte y caché, y `catalogData.js`
  prepara los datos usados por varias pantallas.
- Los estilos de cada pantalla permanecen junto a su componente. `App.css`
  contiene únicamente la estructura global de la aplicación.
- No mover ni reescribir migraciones antiguas: representan la historia de la
  base de datos que ya contiene información real.
- `android/` contiene archivos de Capacitor y Gradle; mantener su estructura
  para que las herramientas puedan generar el APK.
