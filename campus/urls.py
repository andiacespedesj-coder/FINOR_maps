from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api.catalog import (
    AliasLugarCarreraViewSet, CarreraViewSet, CategoriaLugarViewSet,
    EdificioViewSet, FotoLugarViewSet,
    LugarViewSet, PersonaViewSet,
    PisoViewSet, PlanoInteriorViewSet, ResponsableUnidadViewSet,
    UnidadCarreraViewSet,
)
from .api.navigation import ConexionNavegacionViewSet, FotoRutaViewSet, NodoNavegacionViewSet
from .api.transport import LineaTransporteViewSet, ParadaTransporteViewSet

router = DefaultRouter()
router.register(r"categorias", CategoriaLugarViewSet)
router.register(r"carreras", CarreraViewSet)
router.register(r"edificios", EdificioViewSet)
router.register(r"pisos", PisoViewSet)
router.register(r"lugares", LugarViewSet)
router.register(r"planos", PlanoInteriorViewSet)
router.register(r"fotos-lugares", FotoLugarViewSet)
router.register(r"aliases-lugares", AliasLugarCarreraViewSet)
router.register(r"unidades-carrera", UnidadCarreraViewSet)
router.register(r"personas", PersonaViewSet)
router.register(r"responsables-unidad", ResponsableUnidadViewSet)
router.register(r"nodos-navegacion", NodoNavegacionViewSet)
router.register(r"conexiones-navegacion", ConexionNavegacionViewSet)
router.register(r"fotos-ruta", FotoRutaViewSet)
router.register(r"lineas-transporte", LineaTransporteViewSet, basename="linea-transporte")
router.register(r"paradas-transporte", ParadaTransporteViewSet, basename="parada-transporte")

# Rutas de solo lectura conservadas durante la transición de la app beta.
# El nuevo modelo y toda documentación nueva deben usar /edificios y /lugares.
router.register(r"modulos", EdificioViewSet, basename="modulo-beta")
router.register(r"ambientes", LugarViewSet, basename="ambiente-beta")

urlpatterns = [path("", include(router.urls))]
