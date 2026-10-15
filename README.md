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
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

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

---
Desarrollado para la comunidad universitaria de la FINOR - UAGRM.
