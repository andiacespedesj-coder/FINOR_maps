from ..models import ConexionNavegacion, FotoRuta, NodoNavegacion
from .base import ReadOnlyCatalogViewSet
from .serializers.navigation import (
    ConexionNavegacionSerializer,
    FotoRutaSerializer,
    NodoNavegacionSerializer,
)


class NodoNavegacionViewSet(ReadOnlyCatalogViewSet):
    queryset = NodoNavegacion.objects.select_related("campus", "piso", "lugar").order_by("id")
    serializer_class = NodoNavegacionSerializer


class ConexionNavegacionViewSet(ReadOnlyCatalogViewSet):
    queryset = ConexionNavegacion.objects.select_related("nodo_origen", "nodo_destino").order_by("id")
    serializer_class = ConexionNavegacionSerializer


class FotoRutaViewSet(ReadOnlyCatalogViewSet):
    queryset = FotoRuta.objects.select_related("nodo").prefetch_related("flechas__conexion")
    serializer_class = FotoRutaSerializer
