from .base import ReadOnlyCatalogViewSet
from .serializers.transport import LineaTransporteSerializer, ParadaTransporteSerializer
from ..models import LineaTransporte, ParadaTransporte


class LineaTransporteViewSet(ReadOnlyCatalogViewSet):
    queryset = LineaTransporte.objects.filter(publicada=True)
    serializer_class = LineaTransporteSerializer
    pagination_class = None


class ParadaTransporteViewSet(ReadOnlyCatalogViewSet):
    queryset = ParadaTransporte.objects.filter(publicada=True).prefetch_related("lineas")
    serializer_class = ParadaTransporteSerializer
    pagination_class = None
