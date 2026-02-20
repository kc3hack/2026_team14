from django.urls import path
from .views import map_page, worldborders_geojson, pins
from . import views
urlpatterns = [
    path("", map_page, name="map_page"),                 
    path("worldborders.geojson", worldborders_geojson), 
    path("api/pins", pins, name="pins_api"), 
    path("api/pins/<int:pin_id>/image/", views.pin_image_upload, name="pin_image_upload"),#アップロード用
    path("api/pins/<int:pin_id>/images/", views.api_pin_images, name="api_pin_images"),#表示用

]