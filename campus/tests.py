from django.core.exceptions import ValidationError
from django.test import SimpleTestCase
from django.urls import reverse

from .api.serializers.catalog import AutoridadFacultadSerializer
from .api.serializers.navigation import FlechaFotoRutaSerializer
from .models import Campus, Carrera, CategoriaLugar, ConexionNavegacion, Edificio, FlechaFotoRuta, FotoRuta, Lugar, NodoNavegacion, Persona, Piso, ResponsableUnidad, UnidadCarrera


class FotoRutaValidationTests(SimpleTestCase):
    def setUp(self):
        self.origen = NodoNavegacion(id=1, campus_id=1, nombre="Entrada", tipo="ENTRADA")
        self.destino = NodoNavegacion(id=2, campus_id=1, nombre="Pasillo", tipo="PASILLO")
        self.ajeno = NodoNavegacion(id=3, campus_id=1, nombre="Biblioteca", tipo="REFERENCIA")
        self.conexion = ConexionNavegacion(
            id=7, nodo_origen=self.origen, nodo_destino=self.destino,
            tipo="PASILLO", bidireccional=False,
        )

    def test_foto_no_puede_apuntar_a_una_conexion_ajena(self):
        foto = FotoRuta(nodo=self.ajeno, conexion=self.conexion, direccion="ADELANTE")
        with self.assertRaises(ValidationError):
            foto.clean()

    def test_foto_no_puede_indicar_sentido_de_vuelta_en_conexion_unidireccional(self):
        foto = FotoRuta(nodo=self.destino, conexion=self.conexion, direccion="DERECHA")
        with self.assertRaises(ValidationError):
            foto.clean()

    def test_foto_desde_origen_es_valida(self):
        foto = FotoRuta(nodo=self.origen, conexion=self.conexion, direccion="ADELANTE")
        foto.clean()


class FlechaFotoRutaValidationTests(SimpleTestCase):
    def setUp(self):
        self.entrada = NodoNavegacion(id=1, campus_id=1, nombre="Entrada", tipo="ENTRADA")
        self.escaleras = NodoNavegacion(id=2, campus_id=1, nombre="Escaleras", tipo="GRADA")
        self.ajeno = NodoNavegacion(id=3, campus_id=1, nombre="Biblioteca", tipo="REFERENCIA")
        self.conexion = ConexionNavegacion(
            id=7, nodo_origen=self.entrada, nodo_destino=self.escaleras,
            tipo="PASILLO", bidireccional=False,
        )

    def test_flecha_desde_entrada_indica_el_nodo_de_llegada(self):
        foto = FotoRuta(id=4, nodo=self.entrada)
        flecha = FlechaFotoRuta(foto=foto, conexion=self.conexion, direccion="ADELANTE", posicion_x=0.5, posicion_y=0.6)
        flecha.clean()
        self.assertEqual(FlechaFotoRutaSerializer(flecha).data["nodo_destino"], self.escaleras.id)

    def test_flecha_no_puede_apuntar_a_conexion_ajena(self):
        foto = FotoRuta(id=4, nodo=self.ajeno)
        flecha = FlechaFotoRuta(foto=foto, conexion=self.conexion, posicion_x=0.5, posicion_y=0.6)
        with self.assertRaises(ValidationError):
            flecha.clean()

    def test_flecha_de_vuelta_requiere_conexion_bidireccional(self):
        foto = FotoRuta(id=4, nodo=self.escaleras)
        flecha = FlechaFotoRuta(foto=foto, conexion=self.conexion, posicion_x=0.5, posicion_y=0.6)
        with self.assertRaises(ValidationError):
            flecha.clean()


class ResponsableUnidadTests(SimpleTestCase):
    def test_api_muestra_nombre_cargo_y_horario_sin_contactos(self):
        unidad = UnidadCarrera(id=1, campus=Campus(id=1, nombre="FINOR"), tipo="DECANATO", nombre="Decanato", horario_atencion="Lunes a viernes, 8:00 a 12:00")
        autoridad = ResponsableUnidad(
            id=1, unidad=unidad,
            persona=Persona(id=1, nombre_completo="Ana Pérez"),
            cargo="DECANO",
        )
        data = AutoridadFacultadSerializer(autoridad).data
        self.assertEqual(data["nombre"], "Ana Pérez")
        self.assertEqual(data["cargo"], "DECANO")
        self.assertEqual(data["horario_atencion"], "Lunes a viernes, 8:00 a 12:00")
        self.assertEqual(reverse("autoridad-facultad-list"), "/api/autoridades-facultad/")

    def test_oficina_debe_pertenecer_al_campus_de_la_autoridad(self):
        finor = Campus(id=1, nombre="FINOR")
        otro = Campus(id=2, nombre="Otro campus")
        edificio = Edificio(id=1, campus=otro, nombre="Módulo")
        piso = Piso(id=1, edificio=edificio, nombre="Planta Baja")
        lugar = Lugar(id=1, piso=piso, categoria=CategoriaLugar(id=1, nombre="Oficina", codigo="oficina"), nombre="Decanato")
        unidad = UnidadCarrera(campus=finor, tipo="DECANATO", nombre="Decanato", lugar=lugar)
        with self.assertRaises(ValidationError):
            unidad.clean()

    def test_cada_cargo_corresponde_a_su_tipo_de_unidad(self):
        persona = Persona(id=1, nombre_completo="Ana Pérez")
        campus = Campus(id=1, nombre="FINOR")
        lugar = Lugar(id=1, piso_id=1, categoria_id=1, nombre="Dirección")
        decanato = UnidadCarrera(id=2, campus=campus, tipo="DECANATO", nombre="Decanato")
        direccion = UnidadCarrera(id=1, carrera=Carrera(id=1, nombre="Sistemas"), lugar=lugar, tipo="DIRECCION", nombre="Dirección")
        decanato.clean()
        direccion.clean()
        ResponsableUnidad(persona=persona, cargo="DECANO", unidad=decanato).clean()
        ResponsableUnidad(persona=persona, cargo="DIRECTOR", unidad=direccion).clean()
        with self.assertRaises(ValidationError):
            ResponsableUnidad(persona=persona, cargo="DECANO", unidad=direccion).clean()
