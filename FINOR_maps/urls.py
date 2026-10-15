"""
URL configuration for FINOR_maps project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

import os
from django.http import FileResponse, Http404

def download_apk(request):
    apk_path = os.path.join(settings.BASE_DIR, 'FINOR_Maps.apk')
    if os.path.exists(apk_path):
        return FileResponse(open(apk_path, 'rb'), as_attachment=True, filename='FINOR_Maps.apk')
    raise Http404("APK no encontrado")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('campus.urls')),  # Enlazamos nuestra API
    path('apk/', download_apk, name='download_apk'),  # Descarga directa del APK para el celular
]

# Servir archivos multimedia (fotos de ambientes) en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
