from django.contrib.gis import admin
from leaflet.admin import LeafletGeoAdmin
from .models import Categoria, Carrera, Modulo, Piso, Ambiente, Fotografia

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'icono')
    search_fields = ('nombre',)

@admin.register(Carrera)
class CarreraAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo')
    search_fields = ('nombre', 'codigo')

@admin.register(Modulo)
class ModuloAdmin(LeafletGeoAdmin):
    list_display = ('nombre', 'codigo')
    search_fields = ('nombre', 'codigo')
    # GISModelAdmin provee automáticamente un mapa interactivo (OpenStreetMap)
    # para dibujar el polígono.

@admin.register(Piso)
class PisoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'modulo')
    list_filter = ('modulo',)

class FotografiaInline(admin.TabularInline):
    model = Fotografia
    extra = 1

@admin.register(Ambiente)
class AmbienteAdmin(LeafletGeoAdmin):
    list_display = ('nombre', 'codigo', 'categoria', 'piso', 'carrera')
    list_filter = ('categoria', 'piso__modulo', 'carrera')
    search_fields = ('nombre', 'codigo', 'descripcion')
    inlines = [FotografiaInline]
    # GISModelAdmin permite poner el PIN en el mapa para la ubicación.

@admin.register(Fotografia)
class FotografiaAdmin(admin.ModelAdmin):
    list_display = ('ambiente', 'descripcion')
