"""Líneas de transporte y paradas cercanas al campus."""

from django.contrib.gis.db import models


class LineaTransporte(models.Model):
    TIPO_CHOICES = [("SIN_CONFIRMAR", "Por confirmar"), ("MICRO", "Micro"), ("TRUFI", "Trufi")]

    asociacion = models.CharField(max_length=100)
    numero = models.CharField(max_length=20)
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES, default="SIN_CONFIRMAR")
    recorrido_descripcion = models.TextField(blank=True, verbose_name="Descripción del recorrido")
    horario = models.CharField(max_length=120, blank=True)
    publicada = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Línea de transporte"
        verbose_name_plural = "Líneas de transporte"
        ordering = ["asociacion", "numero"]
        constraints = [
            models.UniqueConstraint(fields=["asociacion", "numero"], name="linea_unica_por_asociacion"),
        ]

    def __str__(self):
        return f"Línea {self.numero} · {self.asociacion}"


class ParadaTransporte(models.Model):
    nombre = models.CharField(max_length=120)
    referencia = models.CharField(max_length=200, blank=True)
    ubicacion = models.PointField(srid=4326)
    lineas = models.ManyToManyField(LineaTransporte, related_name="paradas")
    publicada = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Parada de transporte"
        verbose_name_plural = "Paradas de transporte"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre
