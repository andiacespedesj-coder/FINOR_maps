from django.conf import settings
from django.http import FileResponse, Http404


def download_apk(request):
    apk_path = settings.BASE_DIR / "FINOR_Maps.apk"
    if not apk_path.is_file():
        raise Http404("APK no encontrado")
    return FileResponse(apk_path.open("rb"), as_attachment=True, filename="FINOR_Maps.apk")
