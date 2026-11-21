from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .base import ReadOnlyCatalogViewSet
from ..models import (
    AliasLugarCarrera, Carrera, CategoriaLugar, Edificio,
    FotoLugar, Lugar, Persona, Piso, PlanoInterior,
    ResponsableUnidad, UnidadCarrera,
)
from .serializers.catalog import (
    AliasLugarCarreraSerializer, AutoridadFacultadSerializer, CarreraSerializer, CategoriaLugarSerializer,
    EdificioSerializer, FotoLugarSerializer,
    LugarSerializer,
    PersonaSerializer, PisoSerializer, PlanoInteriorSerializer,
    ResponsableUnidadSerializer, UnidadCarreraSerializer,
)


def published_places():
    return Lugar.objects.filter(
        publicado=True, piso__edificio__publicado=True,
    ).select_related("categoria", "piso__edificio").prefetch_related("fotografias")


class CategoriaLugarViewSet(ReadOnlyCatalogViewSet):
    queryset = CategoriaLugar.objects.all()
    serializer_class = CategoriaLugarSerializer
    pagination_class = None


class CarreraViewSet(ReadOnlyCatalogViewSet):
    queryset = Carrera.objects.all()
    serializer_class = CarreraSerializer
    pagination_class = None


class EdificioViewSet(ReadOnlyCatalogViewSet):
    queryset = Edificio.objects.filter(publicado=True).select_related("campus").prefetch_related("pisos__planos")
    serializer_class = EdificioSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "codigo"]
    pagination_class = None

    def get_serializer_context(self):
        context = super().get_serializer_context()
        from collections import defaultdict
        carreras_map = defaultdict(list)
        rows = (
            AliasLugarCarrera.objects.filter(
                activo=True,
                lugar__publicado=True,
                lugar__piso__edificio__publicado=True,
            )
            .values_list("lugar__piso__edificio_id", "carrera__nombre")
            .distinct()
            .order_by("carrera__nombre")
        )
        for edificio_id, carrera_nombre in rows:
            if carrera_nombre not in carreras_map[edificio_id]:
                carreras_map[edificio_id].append(carrera_nombre)
        context["carreras_por_edificio"] = carreras_map
        return context

    @action(detail=False, methods=["get"])
    def mapa(self, request):
        edificios = self.get_queryset()
        lugares = published_places()
        context = self.get_serializer_context()
        edificios_data = EdificioSerializer(
            edificios, many=True, context=context
        ).data
        lugares_data = LugarSerializer(
            lugares, many=True, context=context
        ).data
        return Response({
            "edificios": edificios_data,
            "lugares": lugares_data,
            # Compatibilidad de lectura con la app beta. Se retirará al migrar
            # sus pantallas al vocabulario edificio/lugar.
            # La pantalla de mapa beta espera arreglos de Features, mientras
            # que los nuevos recursos conservan la respuesta GeoJSON estándar.
            "modulos": edificios_data["features"],
            "ambientes": lugares_data["features"],
        })


class PisoViewSet(ReadOnlyCatalogViewSet):
    queryset = Piso.objects.filter(edificio__publicado=True).select_related("edificio").prefetch_related("planos")
    serializer_class = PisoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["edificio"]
    pagination_class = None


class LugarViewSet(ReadOnlyCatalogViewSet):
    queryset = published_places()
    serializer_class = LugarSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["categoria", "piso", "piso__edificio", "accesible", "publico"]
    search_fields = ["nombre", "codigo_visible", "descripcion"]
    pagination_class = None


class PlanoInteriorViewSet(ReadOnlyCatalogViewSet):
    queryset = PlanoInterior.objects.filter(piso__edificio__publicado=True).select_related("piso__edificio")
    serializer_class = PlanoInteriorSerializer


class FotoLugarViewSet(ReadOnlyCatalogViewSet):
    queryset = FotoLugar.objects.filter(lugar__publicado=True, lugar__piso__edificio__publicado=True).select_related("lugar")
    serializer_class = FotoLugarSerializer


class AliasLugarCarreraViewSet(ReadOnlyCatalogViewSet):
    queryset = AliasLugarCarrera.objects.filter(lugar__publicado=True, lugar__piso__edificio__publicado=True).select_related("lugar", "carrera")
    serializer_class = AliasLugarCarreraSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["carrera", "lugar", "tipo", "activo"]
    search_fields = ["alias", "lugar__nombre", "carrera__nombre"]


class UnidadCarreraViewSet(ReadOnlyCatalogViewSet):
    queryset = UnidadCarrera.objects.select_related("carrera", "campus", "lugar").prefetch_related("responsables__persona")
    serializer_class = UnidadCarreraSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["carrera", "campus", "tipo", "activo"]


class PersonaViewSet(ReadOnlyCatalogViewSet):
    queryset = Persona.objects.all()
    serializer_class = PersonaSerializer


class ResponsableUnidadViewSet(ReadOnlyCatalogViewSet):
    queryset = ResponsableUnidad.objects.select_related("unidad__campus", "unidad__lugar", "persona")
    serializer_class = ResponsableUnidadSerializer


class AutoridadFacultadViewSet(ReadOnlyCatalogViewSet):
    queryset = ResponsableUnidad.objects.filter(activo=True, unidad__activo=True, cargo__in=["DECANO", "VICEDECANO"]).select_related("unidad__campus", "unidad__lugar", "persona").order_by("cargo")
    serializer_class = AutoridadFacultadSerializer
    pagination_class = None
