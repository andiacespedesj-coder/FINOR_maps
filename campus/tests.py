from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from .api.serializers.navigation import FlechaFotoRutaSerializer
from .models import ConexionNavegacion, FlechaFotoRuta, FotoRuta, NodoNavegacion


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
