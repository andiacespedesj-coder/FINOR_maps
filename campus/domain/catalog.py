from django.contrib.gis.db import models
from django.core.validators import MaxValueValidator, MinValueValidator

# Entidades y relaciones del catálogo físico del campus.


class Campus(models.Model):
    nombre = models.CharField(max_length=150, unique=True)
    descripcion = models.TextField(blank=True)
    centro_geografico = models.PointField(srid=4326, null=True, blank=True)

    class Meta:
        verbose_name = "Campus"
        verbose_name_plural = "Campus"

    def __str__(self):
        return self.nombre


class CategoriaLugar(models.Model):
    ICON_CHOICES = [
        ("DoorOpen", "Aula / salón"),
        ("FlaskConical", "Laboratorio"),
        ("Library", "Biblioteca"),
        ("Droplets", "Baño"),
        ("Utensils", "Cafetería / comida"),
        ("Briefcase", "Dirección / oficina"),
        ("GraduationCap", "Centro interno / carrera"),
        ("Building2", "Edificio / módulo"),
        ("Trophy", "Cancha / coliseo"),
        ("HeartPulse", "Salud / enfermería"),
        ("CreditCard", "Servicio / cajero"),
        ("Mic", "Auditorio"),
        ("Book", "Estudio / consulta"),
        ("Info", "Información / entrada"),
        ("MoreHorizontal", "Otro lugar"),
    ]

    nombre = models.CharField(max_length=100, unique=True)
    codigo = models.SlugField(max_length=60, unique=True)
    icono = models.CharField(
        max_length=50,
        choices=ICON_CHOICES,
        blank=True,
        help_text="Selecciona el icono que verá el usuario en la aplicación.",
    )
    color = models.CharField(max_length=7, blank=True)

    class Meta:
        verbose_name = "Categoría de lugar"
        verbose_name_plural = "Categorías de lugares"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Carrera(models.Model):
    nombre = models.CharField(max_length=150, unique=True)
    codigo = models.CharField(max_length=20, unique=True, null=True, blank=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = "Carrera"
        verbose_name_plural = "Carreras"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Edificio(models.Model):
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name="edificios")
    nombre = models.CharField(max_length=100, unique=True)
    codigo = models.CharField(max_length=20, unique=True, null=True, blank=True)
    descripcion = models.TextField(blank=True)
    fotografia_principal = models.ImageField(upload_to="edificios/", null=True, blank=True)
    geometria = models.MultiPolygonField(srid=4326, null=True, blank=True)
    publicado = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Edificio"
        verbose_name_plural = "Edificios"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Piso(models.Model):
    edificio = models.ForeignKey(Edificio, on_delete=models.CASCADE, related_name="pisos")
    nombre = models.CharField(max_length=50)
    nivel = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Piso"
        verbose_name_plural = "Pisos"
        ordering = ["edificio__nombre", "nivel", "nombre"]
        constraints = [
            models.UniqueConstraint(fields=["edificio", "nombre"], name="piso_unico_por_edificio"),
        ]

    def __str__(self):
        return f"{self.nombre} - {self.edificio.nombre}"


class PlanoInterior(models.Model):
    piso = models.ForeignKey(Piso, on_delete=models.CASCADE, related_name="planos")
    imagen = models.ImageField(upload_to="planos/")
    version = models.PositiveIntegerField(default=1)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Plano interior"
        verbose_name_plural = "Planos interiores"
        ordering = ["piso", "-version"]
        constraints = [
            models.UniqueConstraint(fields=["piso", "version"], name="version_plano_unica_por_piso"),
        ]


class Lugar(models.Model):
    piso = models.ForeignKey(Piso, on_delete=models.CASCADE, related_name="lugares")
    categoria = models.ForeignKey(CategoriaLugar, on_delete=models.PROTECT, related_name="lugares")
    nombre = models.CharField(max_length=150)
    codigo_visible = models.CharField(max_length=60, blank=True)
    descripcion = models.TextField(blank=True)
    horario = models.TextField(blank=True)
    posicion_x = models.DecimalField(
        max_digits=7,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        verbose_name="Posición horizontal en el plano",
        help_text="Opcional. Use un valor entre 0 y 1, por ejemplo 0.250000. No escriba coordenadas GPS aquí.",
    )
    posicion_y = models.DecimalField(
        max_digits=7,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        verbose_name="Posición vertical en el plano",
        help_text="Opcional. Use un valor entre 0 y 1, por ejemplo 0.750000. No escriba coordenadas GPS aquí.",
    )
    ubicacion_exterior = models.PointField(srid=4326, null=True, blank=True)
    accesible = models.BooleanField(default=False)
    publico = models.BooleanField(default=True)
    publicado = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Lugar"
        verbose_name_plural = "Lugares"
        ordering = ["piso__edificio__nombre", "piso__nivel", "nombre"]

    def __str__(self):
        return self.nombre


class FotoLugar(models.Model):
    lugar = models.ForeignKey(Lugar, on_delete=models.CASCADE, related_name="fotografias")
    imagen = models.ImageField(upload_to="lugares/")
    descripcion = models.CharField(max_length=200, blank=True)
    orden = models.PositiveIntegerField(default=0)
    principal = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Fotografía de lugar"
        verbose_name_plural = "Fotografías de lugares"
        ordering = ["orden", "id"]


class AliasLugarCarrera(models.Model):
    TIPO_CHOICES = [("AULA", "Aula"), ("LABORATORIO", "Laboratorio"), ("GRUPO", "Grupo académico"), ("OTRO", "Otro")]
    lugar = models.ForeignKey(Lugar, on_delete=models.CASCADE, related_name="aliases_carrera")
    carrera = models.ForeignKey(Carrera, on_delete=models.CASCADE, related_name="aliases_lugares")
    alias = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default="AULA")
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Alias de lugar por carrera"
        verbose_name_plural = "Aliases de lugares por carrera"
        ordering = ["carrera__nombre", "alias"]
        constraints = [
            models.UniqueConstraint(
                fields=["lugar", "carrera", "alias"],
                name="alias_unico_por_lugar_carrera",
            ),
        ]

    def __str__(self):
        return f"{self.alias} ({self.carrera.nombre})"


class UnidadCarrera(models.Model):
    TIPO_CHOICES = [("DIRECCION", "Dirección de carrera"), ("CENTRO_INTERNO", "Centro interno")]
    carrera = models.ForeignKey(Carrera, on_delete=models.CASCADE, related_name="unidades")
    lugar = models.ForeignKey(Lugar, on_delete=models.PROTECT, related_name="unidades_carrera")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    nombre = models.CharField(max_length=150)
    horario_atencion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Unidad de carrera"
        verbose_name_plural = "Unidades de carrera"
        constraints = [
            models.UniqueConstraint(fields=["carrera", "tipo"], name="unidad_unica_por_carrera_y_tipo"),
        ]

    def __str__(self):
        return self.nombre


class Persona(models.Model):
    nombre_completo = models.CharField(max_length=150)

    class Meta:
        verbose_name = "Persona"
        verbose_name_plural = "Personas"
        ordering = ["nombre_completo"]

    def __str__(self):
        return self.nombre_completo


class ResponsableUnidad(models.Model):
    CARGO_CHOICES = [("DIRECTOR", "Director(a) de carrera"), ("EJECUTIVO", "Ejecutivo(a) de centro interno")]
    unidad = models.ForeignKey(UnidadCarrera, on_delete=models.CASCADE, related_name="responsables")
    persona = models.ForeignKey(Persona, on_delete=models.PROTECT, related_name="responsabilidades")
    cargo = models.CharField(max_length=20, choices=CARGO_CHOICES)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Responsable de unidad"
        verbose_name_plural = "Responsables de unidades"

    def __str__(self):
        return f"{self.persona.nombre_completo} - {self.unidad.nombre}"
