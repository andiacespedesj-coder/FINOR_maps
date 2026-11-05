from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from ...models import (
    AliasLugarCarrera, Carrera, CategoriaLugar,
    Edificio, FotoLugar, Lugar, Persona, Piso,
    PlanoInterior, ResponsableUnidad, UnidadCarrera,
)


class CategoriaLugarSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaLugar
        fields = "__all__"


class CarreraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrera
        fields = "__all__"


class PlanoInteriorSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanoInterior
        fields = ["id", "imagen", "version", "activo"]


class PisoSerializer(serializers.ModelSerializer):
    planos = PlanoInteriorSerializer(many=True, read_only=True)
    plano = serializers.SerializerMethodField()

    def get_plano(self, piso):
        """Alias temporal para la pantalla beta, que sólo admite un plano."""
        plano_activo = next((plano for plano in piso.planos.all() if plano.activo), None)
        if not plano_activo:
            return None
        url = plano_activo.imagen.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = Piso
        fields = ["id", "edificio", "nombre", "nivel", "planos", "plano"]


class FotoLugarSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoLugar
        fields = ["id", "imagen", "descripcion", "orden", "principal"]


class EdificioSerializer(GeoFeatureModelSerializer):
    pisos = PisoSerializer(many=True, read_only=True)
    fotografia = serializers.ImageField(source="fotografia_principal", read_only=True)
    carreras_nombres = serializers.SerializerMethodField()

    def get_carreras_nombres(self, edificio):
        return list(
            Carrera.objects.filter(
                aliases_lugares__lugar__piso__edificio=edificio,
                aliases_lugares__activo=True,
            ).order_by("nombre").values_list("nombre", flat=True).distinct()
        )

    class Meta:
        model = Edificio
        geo_field = "geometria"
        fields = [
            "id", "campus", "nombre", "codigo", "descripcion", "fotografia_principal",
            "fotografia", "carreras_nombres", "publicado", "pisos",
        ]


class LugarSerializer(GeoFeatureModelSerializer):
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)
    categoria_icono = serializers.CharField(source="categoria.icono", read_only=True)
    piso_nombre = serializers.CharField(source="piso.nombre", read_only=True)
    edificio_id = serializers.IntegerField(source="piso.edificio.id", read_only=True)
    edificio_nombre = serializers.CharField(source="piso.edificio.nombre", read_only=True)
    codigo = serializers.CharField(source="codigo_visible", read_only=True)
    modulo_id = serializers.IntegerField(source="piso.edificio.id", read_only=True)
    modulo_nombre = serializers.CharField(source="piso.edificio.nombre", read_only=True)
    fotografias = FotoLugarSerializer(many=True, read_only=True)

    class Meta:
        model = Lugar
        geo_field = "ubicacion_exterior"
        fields = [
            "id", "nombre", "codigo_visible", "codigo", "descripcion", "horario", "categoria",
            "categoria_nombre", "categoria_icono", "piso", "piso_nombre", "edificio_id",
            "edificio_nombre", "modulo_id", "modulo_nombre", "posicion_x", "posicion_y", "accesible", "publico",
            "publicado", "fotografias",
        ]


class AliasLugarCarreraSerializer(serializers.ModelSerializer):
    lugar_nombre = serializers.CharField(source="lugar.nombre", read_only=True)
    carrera_nombre = serializers.CharField(source="carrera.nombre", read_only=True)

    class Meta:
        model = AliasLugarCarrera
        fields = ["id", "lugar", "lugar_nombre", "carrera", "carrera_nombre", "alias", "tipo", "activo"]


class UnidadCarreraSerializer(serializers.ModelSerializer):
    carrera_nombre = serializers.CharField(source="carrera.nombre", read_only=True, allow_null=True)
    campus_nombre = serializers.CharField(source="campus.nombre", read_only=True, allow_null=True)
    lugar_nombre = serializers.CharField(source="lugar.nombre", read_only=True, allow_null=True)
    responsables = serializers.SerializerMethodField()

    def get_responsables(self, unidad):
        return [
            {
                "nombre": responsable.persona.nombre_completo,
                "cargo": responsable.cargo,
                "activo": responsable.activo,
            }
            for responsable in unidad.responsables.select_related("persona").all()
        ]

    class Meta:
        model = UnidadCarrera
        fields = [
            "id", "carrera", "carrera_nombre", "campus", "campus_nombre", "lugar", "lugar_nombre", "tipo",
            "nombre", "horario_atencion", "activo", "responsables",
        ]


class PersonaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Persona
        fields = "__all__"


class ResponsableUnidadSerializer(serializers.ModelSerializer):
    persona_nombre = serializers.CharField(source="persona.nombre_completo", read_only=True)
    unidad_nombre = serializers.CharField(source="unidad.nombre", read_only=True)
    campus = serializers.IntegerField(source="unidad.campus_id", read_only=True)
    campus_nombre = serializers.CharField(source="unidad.campus.nombre", read_only=True, allow_null=True)
    lugar = serializers.IntegerField(source="unidad.lugar_id", read_only=True)
    horario_atencion = serializers.CharField(source="unidad.horario_atencion", read_only=True)

    class Meta:
        model = ResponsableUnidad
        fields = [
            "id", "unidad", "unidad_nombre", "campus", "campus_nombre", "persona", "persona_nombre", "cargo",
            "lugar", "horario_atencion", "fecha_inicio", "fecha_fin", "activo",
        ]


class AutoridadFacultadSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source="persona.nombre_completo", read_only=True)
    campus = serializers.IntegerField(source="unidad.campus_id", read_only=True)
    campus_nombre = serializers.CharField(source="unidad.campus.nombre", read_only=True)
    horario_atencion = serializers.CharField(source="unidad.horario_atencion", read_only=True)
    lugar = serializers.IntegerField(source="unidad.lugar_id", read_only=True)

    class Meta:
        model = ResponsableUnidad
        fields = ["id", "campus", "campus_nombre", "cargo", "nombre", "horario_atencion", "lugar"]
