from django.urls import path
from .views import map_page, worldborders_geojson

urlpatterns = [
    path("", map_page, name="map_page"),                 # 表示部
    path("worldborders.geojson", worldborders_geojson),  # データ
]