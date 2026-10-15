from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaViewSet, CarreraViewSet, ModuloViewSet,
    PisoViewSet, AmbienteViewSet, FotografiaViewSet
)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'carreras', CarreraViewSet)
router.register(r'modulos', ModuloViewSet)
router.register(r'pisos', PisoViewSet)
router.register(r'ambientes', AmbienteViewSet)
router.register(r'fotografias', FotografiaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
