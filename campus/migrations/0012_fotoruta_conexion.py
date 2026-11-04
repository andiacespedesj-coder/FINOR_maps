from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("campus", "0011_alter_lugar_posicion_x_alter_lugar_posicion_y"),
    ]

    operations = [
        migrations.AddField(
            model_name="fotoruta",
            name="conexion",
            field=models.ForeignKey(
                to="campus.conexionnavegacion",
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="fotos_guiadas",
                null=True,
                blank=True,
                help_text="Conexión que se recorre desde este nodo. Para una ruta de vuelta, registra otra foto desde el nodo opuesto.",
            ),
        ),
    ]
