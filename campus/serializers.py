from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Categoria, Carrera, Modulo, Piso, Ambiente, Fotografia

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class CarreraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrera
        fields = '__all__'

class FotografiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fotografia
        fields = ['id', 'imagen', 'descripcion']

class PisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Piso
        fields = '__all__'

# Para Módulo, usamos GeoFeatureModelSerializer para convertir su polígono a GeoJSON
class ModuloSerializer(GeoFeatureModelSerializer):
    pisos = PisoSerializer(many=True, read_only=True)
    carreras_nombres = serializers.SerializerMethodField()

    class Meta:
        model = Modulo
        geo_field = 'poligono'
        fields = ['id', 'nombre', 'codigo', 'descripcion', 'fotografia', 'carreras_nombres', 'pisos']

    def get_carreras_nombres(self, obj):
        return [carrera.nombre for carrera in obj.carreras.all()]

# Para Ambiente, también usamos GeoFeature para su punto (marcador)
class AmbienteSerializer(GeoFeatureModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    categoria_icono = serializers.CharField(source='categoria.icono', read_only=True)
    carrera_nombre = serializers.CharField(source='carrera.nombre', read_only=True)
    piso_nombre = serializers.CharField(source='piso.nombre', read_only=True)
    modulo_nombre = serializers.CharField(source='piso.modulo.nombre', read_only=True)
    fotografias = FotografiaSerializer(many=True, read_only=True)

    class Meta:
        model = Ambiente
        geo_field = 'ubicacion'
        fields = [
            'id', 'nombre', 'codigo', 'descripcion', 'horario', 'responsable',
            'categoria', 'categoria_nombre', 'categoria_icono', 'carrera', 'carrera_nombre',
            'piso', 'piso_nombre', 'modulo_nombre', 'fotografias'
        ]
