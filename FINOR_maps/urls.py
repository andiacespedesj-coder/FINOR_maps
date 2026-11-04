from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from .views import download_apk


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("campus.urls")),
    path("apk/", download_apk, name="download_apk"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
