# Generated manually for the FINOR Maps data model.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("campus", "0004_modulo_carreras_modulo_fotografia"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="piso",
            constraint=models.UniqueConstraint(
                fields=("modulo", "nombre"), name="piso_unico_por_modulo"
            ),
        ),
        migrations.AddIndex(
            model_name="ambiente",
            index=models.Index(
                fields=["piso", "categoria"], name="ambiente_piso_categoria_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="ambiente",
            index=models.Index(
                fields=["carrera", "nombre"], name="ambiente_carrera_nombre_idx"
            ),
        ),
        migrations.AddConstraint(
            model_name="ambiente",
            constraint=models.UniqueConstraint(
                condition=models.Q(codigo__isnull=False) & ~models.Q(codigo=""),
                fields=("piso", "codigo"),
                name="codigo_ambiente_unico_por_piso",
            ),
        ),
        migrations.AlterModelOptions(
            name="piso",
            options={
                "ordering": ["modulo__nombre", "nombre"],
                "verbose_name": "Piso",
                "verbose_name_plural": "Pisos",
            },
        ),
        migrations.AlterModelOptions(
            name="ambiente",
            options={
                "ordering": ["piso__modulo__nombre", "piso__nombre", "nombre"],
                "verbose_name": "Ambiente",
                "verbose_name_plural": "Ambientes",
            },
        ),
    ]
