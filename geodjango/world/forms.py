from django import forms
from .models import PinImage

class PinImageForm(forms.ModelForm):
    class Meta:
        model = PinImage
        fields = ["image"]