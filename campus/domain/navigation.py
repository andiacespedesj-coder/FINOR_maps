from django.contrib.gis.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator

from .catalog import Campus, Edificio, Lugar, Piso


class NodoNavegacion(models.Model):
    TIPO_CHOICES = [("ENTRADA", "Entrada"), ("SALIDA", "Salida"), ("PASILLO", "Pasillo"), ("GRADA", "Grada"), ("ASCENSOR", "Ascensor"), ("REFERENCIA", "Punto de referencia")]
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name="nodos_navegacion")
    edificio = models.ForeignKey(
        Edificio, on_delete=models.SET_NULL, related_name="nodos_navegacion",
        null=True, blank=True,
        help_text="Edificio o módulo al que pertenece el punto. Si seleccionas un piso, se completará automáticamente.",
    )
    piso = models.ForeignKey(Piso, on_delete=models.CASCADE, related_name="nodos_navegacion", null=True, blank=True)
    lugar = models.ForeignKey(Lugar, on_delete=models.SET_NULL, related_name="nodos_navegacion", null=True, blank=True)
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    posicion_x = models.DecimalField(max_digits=7, decimal_places=6, null=True, blank=True)
    posicion_y = models.DecimalField(max_digits=7, decimal_places=6, null=True, blank=True)
    geometria_exterior = models.PointField(srid=4326, null=True, blank=True)
    accesible = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Nodo de navegación"
        verbose_name_plural = "Nodos de navegación"

    def __str__(self):
        if self.piso_id:
            try:
                return f"[{self.piso.edificio.nombre} · {self.piso.nombre}] {self.nombre}"
            except Exception:
                pass
        if self.edificio_id:
            try:
                return f"[{self.edificio.nombre}] {self.nombre}"
            except Exception:
                pass
        return self.nombre

    def clean(self):
        super().clean()
        if self.piso and not self.edificio:
            self.edificio = self.piso.edificio
        if self.piso and self.edificio and self.piso.edificio_id != self.edificio_id:
            raise ValidationError({"piso": "El piso seleccionado pertenece a otro edificio."})

    def save(self, *args, **kwargs):
        if self.piso and not self.edificio:
            self.edificio = self.piso.edificio
        super().save(*args, **kwargs)


class ConexionNavegacion(models.Model):
    TIPO_CHOICES = [("PASILLO", "Pasillo"), ("GRADA", "Grada"), ("ASCENSOR", "Ascensor"), ("EXTERIOR", "Recorrido exterior")]
    nodo_origen = models.ForeignKey(NodoNavegacion, on_delete=models.CASCADE, related_name="conexiones_salida")
    nodo_destino = models.ForeignKey(NodoNavegacion, on_delete=models.CASCADE, related_name="conexiones_entrada")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    distancia_metros = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    accesible = models.BooleanField(default=True)
    bidireccional = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Conexión de navegación"
        verbose_name_plural = "Conexiones de navegación"
        constraints = [
            models.UniqueConstraint(fields=["nodo_origen", "nodo_destino"], name="conexion_nodos_unica"),
        ]

    def __str__(self):
        return f"{self.nodo_origen} → {self.nodo_destino}"


class FotoRuta(models.Model):
    DIRECCION_CHOICES = [("ADELANTE", "Adelante"), ("IZQUIERDA", "Izquierda"), ("DERECHA", "Derecha")]
    nodo = models.ForeignKey(NodoNavegacion, on_delete=models.CASCADE, related_name="fotos_ruta")
    conexion = models.ForeignKey(
        ConexionNavegacion, on_delete=models.SET_NULL, related_name="fotos_guiadas",
        null=True, blank=True,
        help_text="Conexión que se recorre desde este nodo. Para una ruta de vuelta, registra otra foto desde el nodo opuesto.",
    )
    imagen = models.ImageField(upload_to="rutas/")
    direccion = models.CharField(max_length=20, choices=DIRECCION_CHOICES, default="ADELANTE")
    instruccion = models.CharField(max_length=250, blank=True)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Fotografía de ruta"
        verbose_name_plural = "Fotografías de ruta"
        ordering = ["orden", "id"]

    def __str__(self):
        return f"{self.nodo} · Foto {self.pk or 'nueva'}"

    def clean(self):
        super().clean()
        if not self.conexion_id or not self.nodo_id:
            return
        conexion = self.conexion
        if self.nodo_id not in (conexion.nodo_origen_id, conexion.nodo_destino_id):
            raise ValidationError({"conexion": "La conexión debe comenzar o terminar en el nodo de la fotografía."})
        if self.nodo_id == conexion.nodo_destino_id and not conexion.bidireccional:
            raise ValidationError({"conexion": "Esta conexión no admite el recorrido de vuelta."})


class FlechaFotoRuta(models.Model):
    DIRECCION_CHOICES = [
        ("ADELANTE", "Adelante"), ("IZQUIERDA", "Izquierda"),
        ("DERECHA", "Derecha"), ("ATRAS", "Atrás"),
        ("SUBIR", "Subir"), ("BAJAR", "Bajar"),
    ]
    foto = models.ForeignKey(FotoRuta, on_delete=models.CASCADE, related_name="flechas")
    conexion = models.ForeignKey(ConexionNavegacion, on_delete=models.CASCADE, related_name="flechas_foto")
    direccion = models.CharField(max_length=12, choices=DIRECCION_CHOICES, default="ADELANTE")
    posicion_x = models.DecimalField(max_digits=5, decimal_places=4, validators=[MinValueValidator(0), MaxValueValidator(1)])
    posicion_y = models.DecimalField(max_digits=5, decimal_places=4, validators=[MinValueValidator(0), MaxValueValidator(1)])
    etiqueta = models.CharField(max_length=80, blank=True, help_text="Opcional. Ej.: Hacia las escaleras.")

    class Meta:
        verbose_name = "Flecha sobre fotografía"
        verbose_name_plural = "Flechas sobre fotografía"
        ordering = ["id"]
        constraints = [models.UniqueConstraint(fields=["foto", "conexion"], name="flecha_unica_por_foto_conexion")]

    def __str__(self):
        return f"{self.get_direccion_display()} · {self.conexion}"

    def clean(self):
        super().clean()
        if not self.foto_id or not self.conexion_id:
            return
        nodo_id = self.foto.nodo_id
        conexion = self.conexion
        if nodo_id not in (conexion.nodo_origen_id, conexion.nodo_destino_id):
            raise ValidationError({"conexion": "La conexión debe comenzar o terminar en el nodo de esta fotografía."})
        if nodo_id == conexion.nodo_destino_id and not conexion.bidireccional:
            raise ValidationError({"conexion": "Esta conexión no admite el recorrido de vuelta."})
