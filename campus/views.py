from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Categoria, Carrera, Modulo, Piso, Ambiente, Fotografia
from .serializers import (
    CategoriaSerializer, CarreraSerializer, ModuloSerializer,
    PisoSerializer, AmbienteSerializer, FotografiaSerializer
)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class CarreraViewSet(viewsets.ModelViewSet):
    queryset = Carrera.objects.all()
    serializer_class = CarreraSerializer

class ModuloViewSet(viewsets.ModelViewSet):
    queryset = Modulo.objects.all()
    serializer_class = ModuloSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'codigo']
    pagination_class = None

class PisoViewSet(viewsets.ModelViewSet):
    queryset = Piso.objects.all()
    serializer_class = PisoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['modulo']

class AmbienteViewSet(viewsets.ModelViewSet):
    queryset = Ambiente.objects.all()
    serializer_class = AmbienteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['categoria', 'piso', 'carrera', 'piso__modulo']
    search_fields = ['nombre', 'codigo', 'descripcion', 'responsable']
    pagination_class = None

class FotografiaViewSet(viewsets.ModelViewSet):
    queryset = Fotografia.objects.all()
    serializer_class = FotografiaSerializer
