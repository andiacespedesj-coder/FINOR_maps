from django.db import migrations


def cargar_lineas(apps, schema_editor):
    LineaTransporte = apps.get_model("campus", "LineaTransporte")
    alias = schema_editor.connection.alias
    lineas = [
        ("San Miguel", "5", "Desde la parada cercana a FINOR continúa por la avenida Paichané."),
        ("San Miguel", "8", "Desde la parada cercana a FINOR continúa por la avenida Paichané."),
        ("San Miguel", "10", "Desde la parada cercana a FINOR continúa por la avenida Paichané."),
        ("Florida", "22", "Desde la parada cercana a FINOR continúa por la avenida Paseo Universitario."),
    ]
    for asociacion, numero, recorrido in lineas:
        LineaTransporte.objects.using(alias).get_or_create(
            asociacion=asociacion,
            numero=numero,
            defaults={"recorrido_descripcion": recorrido, "publicada": True},
        )


class Migration(migrations.Migration):
    dependencies = [("campus", "0013_lineatransporte_paradatransporte")]

    operations = [migrations.RunPython(cargar_lineas, migrations.RunPython.noop)]
