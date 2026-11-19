# 🗺️ FINOR Maps

Sistema de Información Geográfica y Navegación Campus FINOR (Facultad Integral del Norte - UAGRM, Montero, Santa Cruz, Bolivia).

## 🚀 Tecnologías

- **Backend:** Python 3, Django, Django REST Framework, django-filter, django-cors-headers.
- **Base de Datos Espacial:** PostgreSQL 16 + PostGIS (GeoDjango).
- **Frontend Web & Mobile:** React, Vite, Leaflet, React-Leaflet.
- **Plataforma Móvil Nativa:** Capacitor (Android).

## 📂 Estructura del Proyecto

```
FINOR_maps/
├── campus/              # Aplicación Django (Modelos espaciales, Vistas API GeoJSON, Serializers)
├── FINOR_maps/          # Configuración del proyecto Django (Settings, URLs, WSGI)
├── finor-maps-app/      # Aplicación Frontend React + Vite + Capacitor
│   ├── android/         # Proyecto nativo Android Studio
│   └── src/             # Componentes React (MapView, BottomSheet, Categorías, Búsqueda)
├── media/               # Archivos multimedia (fotos de ambientes y módulos)
├── manage.py            # CLI de administración de Django
└── requirements.txt     # Dependencias de Python
```

## 🛠️ Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/andiacespedesj-coder/FINOR_maps.git
cd FINOR_maps
```

### 2. Configurar el Backend (Django + PostGIS)
```bash
# Crear y activar entorno virtual
python -m venv venv
# En Windows:
.\venv\Scripts\activate
# En Linux/macOS:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.production.example .env
# Para desarrollo local: configura DEBUG=True, DB_HOST=localhost,
# ALLOWED_HOSTS=localhost,127.0.0.1 y tus credenciales de PostgreSQL.

# Ejecutar migraciones
python manage.py migrate

# Iniciar servidor
python manage.py runserver 0.0.0.0:8000
```

### 3. Configurar el Frontend (React + Capacitor)
```bash
cd finor-maps-app
npm install
npm run dev
```

La organización de las pantallas y servicios se describe en el
[README de la aplicación](finor-maps-app/README.md).

## Publicación móvil

No se debe incluir una IP privada en el APK. Define `VITE_API_URL` con el dominio HTTPS público de la API antes de ejecutar `npm run build`. La guía completa para publicar backend, frontend y APK está en [DEPLOYMENT.md](DEPLOYMENT.md).

## Modelo de datos v2

El catalogo se reinicio para preparar el mapa oficial de la FINOR. La jerarquia
fisica es `Campus -> Edificio -> Piso -> Lugar`; un lugar puede ser un aula,
bano, laboratorio, biblioteca, cafeteria, entrada, cancha, parqueo u otro
servicio mediante una categoria.

Las aulas no se identifican globalmente por codigo. `Alias de lugar por
carrera` permite mostrar una misma ubicacion como `S1`, `Semestre 1`, `Aula
101` u otro nombre propio de cada carrera. Las direcciones de carrera y
centros internos son lugares fisicos y tambien unidades de carrera con horario
y responsable.

La navegacion queda preparada con nodos, conexiones y fotos de ruta. Los datos
reales se registran y validan desde `/admin/` antes de publicarlos en la app.

---
Desarrollado para la comunidad universitaria de la FINOR - UAGRM.
