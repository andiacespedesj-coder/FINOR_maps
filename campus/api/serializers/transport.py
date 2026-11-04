from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from ...models import LineaTransporte, ParadaTransporte


class LineaTransporteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineaTransporte
        fields = ["id", "asociacion", "numero", "tipo", "recorrido_descripcion", "horario"]


class ParadaTransporteSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ParadaTransporte
        geo_field = "ubicacion"
        fields = ["id", "nombre", "referencia", "lineas"]
