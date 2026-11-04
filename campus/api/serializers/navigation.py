from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from ...models import ConexionNavegacion, FlechaFotoRuta, FotoRuta, NodoNavegacion


class NodoNavegacionSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = NodoNavegacion
        geo_field = "geometria_exterior"
        fields = "__all__"


class ConexionNavegacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConexionNavegacion
        fields = "__all__"


class FlechaFotoRutaSerializer(serializers.ModelSerializer):
    nodo_destino = serializers.SerializerMethodField()

    class Meta:
        model = FlechaFotoRuta
        fields = ("id", "conexion", "nodo_destino", "direccion", "posicion_x", "posicion_y", "etiqueta")

    def get_nodo_destino(self, arrow):
        return (arrow.conexion.nodo_destino_id if arrow.foto.nodo_id == arrow.conexion.nodo_origen_id
                else arrow.conexion.nodo_origen_id)


class FotoRutaSerializer(serializers.ModelSerializer):
    flechas = FlechaFotoRutaSerializer(many=True, read_only=True)

    class Meta:
        model = FotoRuta
        fields = "__all__"
