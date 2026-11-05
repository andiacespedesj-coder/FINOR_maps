import django.db.models.deletion
from django.db import migrations, models


TIPO_POR_CARGO = {"DECANO": "DECANATO", "VICEDECANO": "VICEDECANATO"}


def vincular_autoridades_a_unidades(apps, schema_editor):
    UnidadCarrera = apps.get_model("campus", "UnidadCarrera")
    ResponsableUnidad = apps.get_model("campus", "ResponsableUnidad")
    db = schema_editor.connection.alias
    autoridades = ResponsableUnidad.objects.using(db).filter(cargo__in=TIPO_POR_CARGO).order_by("-activo", "id")
    for responsable in autoridades.iterator():
        if not responsable.campus_id:
            raise ValueError(f"El responsable {responsable.pk} no tiene campus; no se puede trasladar sin perder su vínculo.")
        tipo = TIPO_POR_CARGO[responsable.cargo]
        unidad, _ = UnidadCarrera.objects.using(db).get_or_create(
            campus_id=responsable.campus_id,
            tipo=tipo,
            defaults={
                "carrera_id": None,
                "lugar_id": responsable.lugar_id,
                "nombre": "Decanato" if tipo == "DECANATO" else "Vicedecanato",
                "horario_atencion": responsable.horario_atencion,
                "activo": True,
            },
        )
        responsable.unidad_id = unidad.pk
        responsable.save(using=db, update_fields=["unidad"])


def devolver_autoridades_al_campus(apps, schema_editor):
    UnidadCarrera = apps.get_model("campus", "UnidadCarrera")
    ResponsableUnidad = apps.get_model("campus", "ResponsableUnidad")
    db = schema_editor.connection.alias
    autoridades = ResponsableUnidad.objects.using(db).filter(cargo__in=TIPO_POR_CARGO).select_related("unidad")
    for responsable in autoridades.iterator():
        unidad = responsable.unidad
        responsable.campus_id = unidad.campus_id
        responsable.lugar_id = unidad.lugar_id
        responsable.horario_atencion = unidad.horario_atencion
        responsable.unidad_id = None
        responsable.save(using=db, update_fields=["campus", "lugar", "horario_atencion", "unidad"])
    UnidadCarrera.objects.using(db).filter(tipo__in=TIPO_POR_CARGO.values()).delete()


class Migration(migrations.Migration):
    dependencies = [("campus", "0018_autoridades_en_responsables")]

    operations = [
        migrations.AddField(
            model_name="unidadcarrera", name="campus",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="unidades_facultad", to="campus.campus"),
        ),
        migrations.AlterField(
            model_name="unidadcarrera", name="carrera",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="unidades", to="campus.carrera"),
        ),
        migrations.AlterField(
            model_name="unidadcarrera", name="lugar",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="unidades_carrera", to="campus.lugar"),
        ),
        migrations.AlterField(
            model_name="unidadcarrera", name="tipo",
            field=models.CharField(choices=[("DIRECCION", "Dirección de carrera"), ("CENTRO_INTERNO", "Centro interno"), ("DECANATO", "Decanato"), ("VICEDECANATO", "Vicedecanato")], max_length=20),
        ),
        migrations.AddConstraint(
            model_name="unidadcarrera",
            constraint=models.UniqueConstraint(condition=models.Q(tipo__in=["DECANATO", "VICEDECANATO"]), fields=("campus", "tipo"), name="unidad_facultad_unica_por_campus_tipo"),
        ),
        migrations.RunPython(vincular_autoridades_a_unidades, devolver_autoridades_al_campus),
        migrations.RemoveConstraint(model_name="responsableunidad", name="responsable_facultad_activo_unico"),
        migrations.AddConstraint(
            model_name="responsableunidad",
            constraint=models.UniqueConstraint(condition=models.Q(activo=True, cargo__in=["DECANO", "VICEDECANO"]), fields=("unidad", "cargo"), name="responsable_facultad_unico_por_unidad"),
        ),
        migrations.AlterField(
            model_name="responsableunidad", name="unidad",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="responsables", to="campus.unidadcarrera"),
        ),
        migrations.RemoveField(model_name="responsableunidad", name="campus"),
        migrations.RemoveField(model_name="responsableunidad", name="lugar"),
        migrations.RemoveField(model_name="responsableunidad", name="horario_atencion"),
    ]
