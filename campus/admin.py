from django.contrib import admin
from django.db.models import Q
from django.utils.html import format_html
from leaflet.admin import LeafletGeoAdmin

from .admin_forms import CategoriaLugarAdminForm, LugarAdminForm
from .models import (
    AliasLugarCarrera, Campus, Carrera, CategoriaLugar, ConexionNavegacion,
    Edificio, FlechaFotoRuta, FotoLugar, FotoRuta, LineaTransporte, Lugar, NodoNavegacion,
    ParadaTransporte, Persona, Piso, PlanoInterior, ResponsableUnidad, UnidadCarrera,
)


@admin.register(Campus)
class CampusAdmin(LeafletGeoAdmin):
    list_display = ("nombre",)


@admin.register(CategoriaLugar)
class CategoriaLugarAdmin(admin.ModelAdmin):
    form = CategoriaLugarAdminForm
    list_display = ("nombre", "codigo", "icono", "color")
    search_fields = ("nombre", "codigo")
    fields = ("nombre", "codigo", "icono", "color")

    class Media:
        css = {"all": ("campus/admin/category_icon_picker.css",)}
        js = ("campus/admin/category_icon_picker.js",)


@admin.register(Carrera)
class CarreraAdmin(admin.ModelAdmin):
    list_display = ("nombre", "codigo")
    search_fields = ("nombre", "codigo")


@admin.register(Edificio)
class EdificioAdmin(LeafletGeoAdmin):
    list_display = ("nombre", "codigo", "campus", "publicado")
    list_filter = ("campus", "publicado")
    search_fields = ("nombre", "codigo")


@admin.register(Piso)
class PisoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "nivel", "edificio")
    list_filter = ("edificio",)


@admin.register(Lugar)
class LugarAdmin(LeafletGeoAdmin):
    form = LugarAdminForm
    list_display = ("nombre", "codigo_visible", "categoria", "piso", "publicado")
    list_filter = ("categoria", "piso__edificio", "publicado", "accesible")
    search_fields = ("nombre", "codigo_visible", "descripcion")
    fieldsets = (
        ("Información del lugar", {
            "fields": ("nombre", "codigo_visible", "categoria", "piso", "descripcion", "horario"),
        }),
        ("Ubicación en el mapa exterior", {
            "fields": ("ubicacion_exterior",),
            "description": "Marque el lugar sobre el mapa. Aquí se registra la ubicación GPS; no debe escribir latitud ni longitud en los campos del plano.",
        }),
        ("Ubicación dentro del plano (opcional)", {
            "fields": ("posicion_x", "posicion_y"),
            "description": "Úselo solo después de cargar un plano interior. Ambos valores van de 0 a 1.",
        }),
        ("Visibilidad y accesibilidad", {
            "fields": ("accesible", "publico", "publicado"),
        }),
    )


@admin.register(NodoNavegacion)
class NodoNavegacionAdmin(LeafletGeoAdmin):
    map_template = "campus/admin/navigation_node_map.html"
    settings_overrides = {
        "DEFAULT_CENTER": (-17.33848, -63.26879),
        "DEFAULT_ZOOM": 19,
        "SPATIAL_EXTENT": (-63.2720, -17.3410, -63.2650, -17.3350),
    }
    list_display = ("nombre", "tipo", "campus", "piso", "lugar")
    list_filter = ("campus", "tipo", "piso__edificio")
    search_fields = ("nombre", "lugar__nombre")
    fieldsets = (
        ("Punto de la ruta", {"fields": ("campus", "nombre", "tipo", "accesible")}),
        ("Relación con el edificio y el destino", {
            "fields": ("piso", "lugar"),
            "description": "Selecciona el piso si el punto está dentro de un edificio. Usa Lugar solo cuando este nodo corresponde a un destino concreto, por ejemplo la puerta de un aula. Para una entrada o cruce general, déjalo vacío.",
        }),
        ("Punto en el mapa exterior", {
            "fields": ("geometria_exterior",),
            "description": "Marca el punto real en el mapa solo para rutas exteriores o entradas localizables con GPS. No representa la posición actual del usuario.",
        }),
        ("Posición en el plano interior (opcional)", {
            "fields": ("posicion_x", "posicion_y"),
            "description": "Úsala solo si existe un plano del piso. X e Y son proporciones entre 0 y 1; no son latitud ni longitud. Déjalas vacías en puntos exteriores.",
        }),
    )


@admin.register(ConexionNavegacion)
class ConexionNavegacionAdmin(admin.ModelAdmin):
    list_display = ("nodo_origen", "nodo_destino", "tipo", "distancia_metros", "bidireccional")
    list_filter = ("tipo", "bidireccional", "accesible")
    search_fields = ("nodo_origen__nombre", "nodo_destino__nombre")
    autocomplete_fields = ("nodo_origen", "nodo_destino")
    list_select_related = ("nodo_origen", "nodo_destino")


class FlechaFotoRutaInline(admin.TabularInline):
    model = FlechaFotoRuta
    extra = 1
    fields = ("conexion", "direccion", "etiqueta", "posicion_x", "posicion_y")
    verbose_name = "Flecha en esta foto"
    verbose_name_plural = "Flechas en esta foto"

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "conexion":
            photo_id = request.resolver_match.kwargs.get("object_id")
            photo = FotoRuta.objects.filter(pk=photo_id).select_related("nodo").first() if photo_id else None
            if photo:
                kwargs["queryset"] = ConexionNavegacion.objects.filter(
                    Q(nodo_origen_id=photo.nodo_id) |
                    Q(nodo_destino_id=photo.nodo_id, bidireccional=True)
                ).select_related("nodo_origen", "nodo_destino")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(FotoRuta)
class FotoRutaAdmin(admin.ModelAdmin):
    list_display = ("nodo", "orden", "numero_flechas")
    search_fields = ("nodo__nombre",)
    autocomplete_fields = ("nodo",)
    list_select_related = ("nodo",)
    readonly_fields = ("editor_flechas",)
    inlines = (FlechaFotoRutaInline,)
    fieldsets = (
        ("Fotografía del punto", {"fields": ("nodo", "imagen", "instruccion", "orden")}),
        ("Colocar flechas", {
            "fields": ("editor_flechas",),
            "description": "Guarda primero la foto. Después añade una fila de flecha, elige la conexión y dirección, selecciona esa fila y haz clic en el lugar de la foto donde debe aparecer.",
        }),
    )

    def get_inline_instances(self, request, obj=None):
        return super().get_inline_instances(request, obj) if obj else []

    @admin.display(description="Flechas")
    def numero_flechas(self, obj):
        return obj.flechas.count()

    @admin.display(description="Vista de las flechas")
    def editor_flechas(self, obj):
        if not obj or not obj.imagen:
            return "Guarda la fotografía para colocar las flechas sobre ella."
        return format_html(
            '<div id="finor-arrow-editor" data-image-url="{}">'
            '<p class="help">Selecciona una fila de flecha abajo y haz clic en la imagen. Puedes moverla haciendo otro clic y añadir varias salidas.</p>'
            '<div class="finor-arrow-surface"><img src="{}" alt="Fotografía del recorrido"><div class="finor-arrow-markers"></div></div>'
            '<p class="finor-arrow-selection" role="status">Selecciona una flecha para colocarla.</p></div>',
            obj.imagen.url, obj.imagen.url,
        )

    class Media:
        css = {"all": ("campus/admin/route_arrow_editor.css",)}
        js = ("campus/admin/route_arrow_editor.js",)


@admin.register(LineaTransporte)
class LineaTransporteAdmin(admin.ModelAdmin):
    list_display = ("numero", "asociacion", "tipo", "publicada")
    list_filter = ("asociacion", "tipo", "publicada")
    search_fields = ("numero", "asociacion", "recorrido_descripcion")


@admin.register(ParadaTransporte)
class ParadaTransporteAdmin(LeafletGeoAdmin):
    list_display = ("nombre", "referencia", "publicada")
    list_filter = ("publicada", "lineas")
    search_fields = ("nombre", "referencia")
    filter_horizontal = ("lineas",)
    fieldsets = (
        ("Parada", {"fields": ("nombre", "referencia", "lineas", "publicada")}),
        ("Ubicación exacta", {
            "fields": ("ubicacion",),
            "description": "Marca la parada real fuera de la facultad. Publícala solo después de verificar el punto.",
        }),
    )


@admin.register(UnidadCarrera)
class UnidadCarreraAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tipo", "carrera", "campus", "lugar", "activo")
    list_filter = ("tipo", "campus", "carrera", "activo")
    search_fields = ("nombre", "carrera__nombre", "campus__nombre", "lugar__nombre")
    list_select_related = ("carrera", "campus", "lugar")
    fieldsets = (
        ("Unidad", {"fields": ("nombre", "tipo", "activo")}),
        ("A quién pertenece", {
            "fields": ("carrera", "campus"),
            "description": "Dirección y Centro interno: selecciona Carrera. Decanato y Vicedecanato: selecciona Campus FINOR. Deja vacío el otro campo.",
        }),
        ("Atención", {"fields": ("lugar", "horario_atencion")}),
    )


@admin.register(ResponsableUnidad)
class ResponsableUnidadAdmin(admin.ModelAdmin):
    list_display = ("persona", "cargo", "unidad", "activo")
    list_filter = ("cargo", "unidad__tipo", "activo")
    search_fields = ("persona__nombre_completo", "unidad__nombre")
    list_select_related = ("unidad", "persona")
    fieldsets = (
        ("Persona y cargo", {"fields": ("persona", "cargo", "unidad", "activo"),
                             "description": "Crea primero la unidad correspondiente. Decano usa Decanato y Vicedecano usa Vicedecanato."}),
        ("Vigencia", {"fields": ("fecha_inicio", "fecha_fin")}),
    )


admin.site.register((PlanoInterior, FotoLugar, AliasLugarCarrera, Persona))
