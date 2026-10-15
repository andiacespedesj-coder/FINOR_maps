from django.contrib.gis.db import models

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre")
    ICON_CHOICES = [
        ('Book', '📖 Libro / Biblioteca'),
        ('Building2', '🏢 Módulo / Edificio'),
        ('GraduationCap', '🎓 Carrera'),
        ('Briefcase', '💼 Oficina'),
        ('DoorOpen', '🚪 Aula'),
        ('FlaskConical', '🧪 Laboratorio'),
        ('Library', '📚 Biblioteca'),
        ('Mic', '🎤 Auditorio'),
        ('Trophy', '🏆 Cancha / Deportes'),
        ('Info', 'ℹ️ Información'),
        ('Utensils', '🍴 Comida / Kiosko'),
        ('Droplets', '💧 Baños'),
        ('CreditCard', '💳 Cajero'),
        ('HeartPulse', '❤️ Salud / Enfermería'),
        ('MoreHorizontal', '⋯ Otros'),
    ]
    icono = models.CharField(
        max_length=50, choices=ICON_CHOICES, null=True, blank=True, verbose_name="Ícono",
        help_text="Seleccione el ícono visual que aparecerá en la aplicación."
    )

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

    def __str__(self):
        return self.nombre


class Carrera(models.Model):
    nombre = models.CharField(max_length=150, unique=True, verbose_name="Nombre")
    codigo = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name="Código")

    def __str__(self):
        return self.nombre


class Modulo(models.Model):
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Módulo")
    codigo = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name="Código")
    descripcion = models.TextField(null=True, blank=True, verbose_name="Descripción")
    fotografia = models.ImageField(upload_to="modulos/", null=True, blank=True, verbose_name="Fotografía Principal")
    carreras = models.ManyToManyField(Carrera, blank=True, related_name="modulos", verbose_name="Carreras en este Módulo")
    
    # Campo geográfico: Polígono con SRID 4326 (WGS 84)
    poligono = models.PolygonField(srid=4326, verbose_name="Polígono del Edificio")

    class Meta:
        verbose_name = "Módulo"
        verbose_name_plural = "Módulos"

    def __str__(self):
        return self.nombre


class Piso(models.Model):
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name="pisos", verbose_name="Módulo")
    nombre = models.CharField(max_length=50, verbose_name="Nombre del Piso")
    plano = models.FileField(upload_to="planos/", null=True, blank=True, verbose_name="Plano del Piso")

    class Meta:
        verbose_name = "Piso"
        verbose_name_plural = "Pisos"

    def __str__(self):
        return f"{self.nombre} - {self.modulo.nombre}"


class Ambiente(models.Model):
    piso = models.ForeignKey(Piso, on_delete=models.CASCADE, related_name="ambientes", verbose_name="Piso")
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name="ambientes", verbose_name="Categoría")
    carrera = models.ForeignKey(Carrera, on_delete=models.SET_NULL, null=True, blank=True, related_name="ambientes", verbose_name="Carrera")
    
    nombre = models.CharField(max_length=100, verbose_name="Nombre del Ambiente")
    codigo = models.CharField(max_length=50, null=True, blank=True, verbose_name="Código")
    descripcion = models.TextField(null=True, blank=True, verbose_name="Descripción")
    horario = models.TextField(null=True, blank=True, verbose_name="Horario")
    responsable = models.CharField(max_length=150, null=True, blank=True, verbose_name="Responsable")
    
    # Campo geográfico: Punto exacto con SRID 4326
    ubicacion = models.PointField(srid=4326, verbose_name="Ubicación (Marcador)")

    class Meta:
        verbose_name = "Ambiente"
        verbose_name_plural = "Ambientes"

    def __str__(self):
        return f"{self.nombre} ({self.piso.nombre})"


class Fotografia(models.Model):
    ambiente = models.ForeignKey(Ambiente, on_delete=models.CASCADE, related_name="fotografias")
    imagen = models.ImageField(upload_to="ambientes/", verbose_name="Fotografía")
    descripcion = models.CharField(max_length=200, null=True, blank=True, verbose_name="Descripción corta")

    class Meta:
        verbose_name = "Fotografía"
        verbose_name_plural = "Fotografías"

    def __str__(self):
        return f"Foto de {self.ambiente.nombre}"
