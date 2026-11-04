from django import forms

from .models import CategoriaLugar, Lugar


class CategoriaLugarAdminForm(forms.ModelForm):
    icono = forms.ChoiceField(
        choices=CategoriaLugar.ICON_CHOICES,
        required=True,
        widget=forms.RadioSelect(attrs={"class": "category-icon-choice"}),
        help_text="Haz clic en el icono que representará esta categoría en la aplicación.",
    )

    class Meta:
        model = CategoriaLugar
        fields = "__all__"
        widgets = {"color": forms.TextInput(attrs={"type": "color"})}


class LugarAdminForm(forms.ModelForm):
    class Meta:
        model = Lugar
        fields = "__all__"
        widgets = {
            "posicion_x": forms.NumberInput(attrs={"min": 0, "max": 1, "step": "0.000001", "placeholder": "Ej.: 0.250000"}),
            "posicion_y": forms.NumberInput(attrs={"min": 0, "max": 1, "step": "0.000001", "placeholder": "Ej.: 0.750000"}),
        }
