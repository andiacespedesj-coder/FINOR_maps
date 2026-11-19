from django.core.exceptions import ValidationError
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.forms import modelform_factory
from django.test import RequestFactory, SimpleTestCase, TestCase, override_settings
from django.urls import reverse

from .api.serializers.catalog import AutoridadFacultadSerializer
from .api.serializers.navigation import FlechaFotoRutaSerializer
from .models import AliasLugarCarrera, Campus, Carrera, CategoriaLugar, ConexionNavegacion, Edificio, FlechaFotoRuta, FotoLugar, FotoRuta, Lugar, NodoNavegacion, Persona, Piso, PlanoInterior, ResponsableUnidad, UnidadCarrera


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
    def test_unidades_con_el_mismo_nombre_muestran_tipo_y_carrera(self):
        sistemas = Carrera(id=1, nombre="Ingeniería en Sistemas")
        derecho = Carrera(id=2, nombre="Derecho")
        primera = UnidadCarrera(nombre="Administrativo", tipo="DIRECCION", carrera=sistemas)
        segunda = UnidadCarrera(nombre="Administrativo", tipo="CENTRO_INTERNO", carrera=derecho)
        self.assertEqual(str(primera), "Administrativo · Dirección de carrera · Ingeniería en Sistemas")
        self.assertEqual(str(segunda), "Administrativo · Centro interno · Derecho")

    def test_unidad_de_facultad_muestra_el_campus_sin_repetir_el_tipo(self):
        unidad = UnidadCarrera(nombre="Decanato", tipo="DECANATO", campus=Campus(id=1, nombre="FINOR"))
        self.assertEqual(str(unidad), "Decanato · FINOR")

    def test_unidad_puede_guardarse_sin_carrera_campus_ni_lugar(self):
        for tipo in ("DECANATO", "VICEDECANATO", "DIRECCION", "CENTRO_INTERNO"):
            with self.subTest(tipo=tipo):
                unidad = UnidadCarrera(nombre="Oficina", tipo=tipo)
                unidad.clean()
                self.assertIsNone(unidad.campus_id)

    def test_facultad_toma_el_campus_del_lugar_sin_exigir_otro_campo(self):
        campus = Campus(id=1, nombre="FINOR")
        edificio = Edificio(id=1, campus=campus, nombre="Módulo")
        piso = Piso(id=1, edificio=edificio, nombre="Planta baja")
        lugar = Lugar(id=1, piso=piso, categoria_id=1, nombre="Oficinas")
        unidad = UnidadCarrera(nombre="Administrativo", tipo="VICEDECANATO", lugar=lugar)
        unidad.clean()
        self.assertEqual(unidad.campus_id, campus.id)

    def test_unidad_puede_tener_carrera_y_campus(self):
        campus = Campus(id=1, nombre="FINOR")
        edificio = Edificio(id=1, campus=campus, nombre="Módulo")
        piso = Piso(id=1, edificio=edificio, nombre="Planta baja")
        lugar = Lugar(id=1, piso=piso, categoria_id=1, nombre="Oficinas")
        unidad = UnidadCarrera(nombre="Administrativo", tipo="VICEDECANATO", lugar=lugar,
                               carrera=Carrera(id=2, nombre="Oficinas"), campus=campus)
        unidad.clean()
        self.assertEqual(str(unidad), "Administrativo · Vicedecanato · Oficinas · FINOR")

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

    def test_cualquier_cargo_puede_asignarse_a_una_unidad(self):
        persona = Persona(id=1, nombre_completo="Ana Pérez")
        campus = Campus(id=1, nombre="FINOR")
        edificio = Edificio(id=1, campus=campus, nombre="Módulo")
        piso = Piso(id=1, edificio=edificio, nombre="Planta baja")
        lugar = Lugar(id=1, piso=piso, categoria_id=1, nombre="Dirección")
        decanato = UnidadCarrera(id=2, campus=campus, tipo="DECANATO", nombre="Decanato")
        direccion = UnidadCarrera(id=1, carrera=Carrera(id=1, nombre="Sistemas"), lugar=lugar, tipo="DIRECCION", nombre="Dirección")
        decanato.clean()
        direccion.clean()
        ResponsableUnidad(persona=persona, cargo="DECANO", unidad=decanato).clean()
        ResponsableUnidad(persona=persona, cargo="DIRECTOR", unidad=direccion).clean()
        ResponsableUnidad(persona=persona, cargo="DECANO", unidad=direccion).clean()
        ResponsableUnidad(persona=persona, cargo="DIRECTOR", unidad=decanato).clean()

    def test_autoridad_sin_campus_puede_mostrarse_en_la_api(self):
        unidad = UnidadCarrera(id=1, nombre="Oficina", tipo="DIRECCION")
        autoridad = ResponsableUnidad(id=1, unidad=unidad, persona=Persona(id=1, nombre_completo="Ana Pérez"), cargo="DECANO")
        data = AutoridadFacultadSerializer(autoridad).data
        self.assertEqual(data["nombre"], "Ana Pérez")
        self.assertIsNone(data["campus"])


@override_settings(ALLOWED_HOSTS=["testserver"], SECURE_SSL_REDIRECT=False)
class PublicacionCatalogoTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        campus = Campus.objects.create(nombre="Campus de prueba")
        categoria = CategoriaLugar.objects.create(nombre="Aula", codigo="aula")
        carrera = Carrera.objects.create(nombre="Carrera de prueba")
        cls.edificio = Edificio.objects.create(campus=campus, nombre="Edificio público", publicado=True)
        cls.edificio_oculto = Edificio.objects.create(campus=campus, nombre="Edificio oculto", publicado=False)
        piso = Piso.objects.create(edificio=cls.edificio, nombre="Planta baja")
        piso_oculto = Piso.objects.create(edificio=cls.edificio_oculto, nombre="Planta baja")
        cls.piso_oculto = piso_oculto
        cls.publico = Lugar.objects.create(piso=piso, categoria=categoria, nombre="Aula pública", publicado=True)
        cls.borrador = Lugar.objects.create(piso=piso, categoria=categoria, nombre="Aula borrador", publicado=False)
        cls.en_edificio_oculto = Lugar.objects.create(piso=piso_oculto, categoria=categoria, nombre="Aula en edificio oculto", publicado=True)
        cls.plano_oculto = PlanoInterior.objects.create(piso=piso_oculto, imagen="planos/ejemplo.png")
        for lugar in (cls.publico, cls.borrador, cls.en_edificio_oculto):
            FotoLugar.objects.create(lugar=lugar, imagen=f"lugares/{lugar.pk}.jpg")
            AliasLugarCarrera.objects.create(lugar=lugar, carrera=carrera, alias=f"Alias {lugar.pk}")

    def test_listas_y_mapa_solo_incluyen_edificios_y_lugares_publicados(self):
        edificios = self.client.get("/api/edificios/").json()["features"]
        lugares = self.client.get("/api/lugares/").json()["features"]
        mapa = self.client.get("/api/edificios/mapa/").json()
        self.assertEqual([item["id"] for item in edificios], [self.edificio.pk])
        self.assertEqual([item["id"] for item in lugares], [self.publico.pk])
        self.assertEqual([item["id"] for item in mapa["edificios"]["features"]], [self.edificio.pk])
        self.assertEqual([item["id"] for item in mapa["lugares"]["features"]], [self.publico.pk])

    def test_detalles_no_devuelven_registros_no_publicados(self):
        for path in (
            f"/api/edificios/{self.edificio_oculto.pk}/",
            f"/api/lugares/{self.borrador.pk}/",
            f"/api/lugares/{self.en_edificio_oculto.pk}/",
            f"/api/pisos/{self.piso_oculto.pk}/",
            f"/api/planos/{self.plano_oculto.pk}/",
        ):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 404)

    def test_fotos_y_alias_solo_incluyen_lugares_publicados(self):
        fotos = self.client.get("/api/fotos-lugares/").json()["results"]
        aliases = self.client.get("/api/aliases-lugares/").json()["results"]
        self.assertEqual([foto["imagen"].split("/")[-1] for foto in fotos], [f"{self.publico.pk}.jpg"])
        self.assertEqual([alias["lugar"] for alias in aliases], [self.publico.pk])


class UnidadFlexibleFormTests(TestCase):
    def test_oficina_y_responsable_se_guardan_sin_elegir_campus(self):
        campus = Campus.objects.create(nombre="FINOR")
        edificio = Edificio.objects.create(campus=campus, nombre="Módulo")
        piso = Piso.objects.create(edificio=edificio, nombre="Planta baja")
        categoria = CategoriaLugar.objects.create(nombre="Oficina", codigo="oficina")
        lugar = Lugar.objects.create(piso=piso, categoria=categoria, nombre="Oficinas")
        carrera = Carrera.objects.create(nombre="Oficinas")
        unidad_form = modelform_factory(UnidadCarrera, fields=["nombre", "tipo", "carrera", "campus", "lugar", "activo"])(data={
            "nombre": "Administrativo", "tipo": "VICEDECANATO", "carrera": carrera.pk,
            "campus": "", "lugar": lugar.pk, "activo": "on",
        })
        self.assertTrue(unidad_form.is_valid(), unidad_form.errors)
        unidad = unidad_form.save()
        unidad.refresh_from_db()
        self.assertEqual(unidad.campus_id, campus.pk)
        self.assertEqual(unidad.carrera_id, carrera.pk)

        persona = Persona.objects.create(nombre_completo="Persona de prueba")
        responsable_form = modelform_factory(ResponsableUnidad, fields=["persona", "cargo", "unidad", "activo"])(data={
            "persona": persona.pk, "cargo": "DIRECTOR", "unidad": unidad.pk, "activo": "on",
        })
        self.assertTrue(responsable_form.is_valid(), responsable_form.errors)
        self.assertEqual(responsable_form.save().unidad_id, unidad.pk)

    def test_selector_del_admin_distingue_unidades_con_el_mismo_nombre(self):
        campus = Campus.objects.create(nombre="FINOR")
        carrera = Carrera.objects.create(nombre="Ingeniería en Sistemas")
        decanato = UnidadCarrera.objects.create(nombre="Administrativo:", tipo="DECANATO", campus=campus)
        direccion = UnidadCarrera.objects.create(nombre="Administrativo:", tipo="DIRECCION", carrera=carrera)
        request = RequestFactory().get("/")
        request.user = get_user_model().objects.create_superuser(username="admin_prueba", password="prueba")
        form = admin.site._registry[ResponsableUnidad].get_form(request)()
        opciones = {str(value): label for value, label in form.fields["unidad"].choices if value}
        self.assertEqual(opciones[str(decanato.pk)], "Decanato · FINOR · Administrativo")
        self.assertEqual(opciones[str(direccion.pk)], "Dirección de carrera · Ingeniería en Sistemas · Administrativo")


@override_settings(ALLOWED_HOSTS=["testserver"], SECURE_SSL_REDIRECT=False)
class FotoLugarAdminTests(TestCase):
    def test_lista_identifica_y_encuentra_la_fotografia_por_lugar(self):
        campus = Campus.objects.create(nombre="FINOR")
        edificio = Edificio.objects.create(campus=campus, nombre="Módulo 1")
        piso = Piso.objects.create(edificio=edificio, nombre="Piso 3")
        categoria = CategoriaLugar.objects.create(nombre="Laboratorio", codigo="laboratorio")
        lugar = Lugar.objects.create(piso=piso, categoria=categoria, nombre="Laboratorio 2")
        foto = FotoLugar.objects.create(lugar=lugar, imagen="lugares/ejemplo.jpg")
        self.assertEqual(str(foto), f"Laboratorio 2 · Foto {foto.pk}")

        usuario = get_user_model().objects.create_superuser(username="admin_fotos", password="prueba")
        self.client.force_login(usuario)
        respuesta = self.client.get(reverse("admin:campus_fotolugar_changelist"), {"q": "Laboratorio 2"})
        self.assertContains(respuesta, "Laboratorio 2")
        self.assertContains(respuesta, "Piso 3")
        self.assertContains(respuesta, "Módulo 1")
        self.assertNotContains(respuesta, "FotoLugar object")
