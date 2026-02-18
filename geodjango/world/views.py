from django.shortcuts import render
from django.http import JsonResponse
from world.models import WorldBorder

def worldborders_geojson(request):
    features = []
    for w in WorldBorder.objects.all():
        features.append({
            "type": "Feature",
            "properties": {"name": w.name},
            "geometry": w.mpoly.geojson and __import__("json").loads(w.mpoly.geojson),
        })
    return JsonResponse({"type": "FeatureCollection", "features": features})
def map_page(request):
    return render(request, "world/map.html")