from django.urls import path
from .views import map_page, worldborders_geojson, pins

urlpatterns = [
    path("", map_page, name="map_page"),                 
    path("worldborders.geojson", worldborders_geojson), 
    path("api/pins", pins, name="pins_api"), 
]