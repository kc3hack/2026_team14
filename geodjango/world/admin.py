from django.contrib.gis import admin
from .models import WorldBorder, Pin

admin.site.register(WorldBorder, admin.ModelAdmin)
admin.site.register(Pin, admin.ModelAdmin)