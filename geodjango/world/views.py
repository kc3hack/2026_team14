import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import Point
from .models import Pin
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
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

def pin_get(request):
    pins = Pin.objects.filter(user=request.user)
    data = [
        {
            
            "name": pin.name,
            "ido": pin.location.y,
            "keido": pin.location.x,
        }
        for pin in pins
    ]
    return JsonResponse({"pins": data})
@csrf_exempt
def pins(request):
    if request.method == "GET":
        return pin_get(request)
    if request.method == "POST":
        try:
            body = json.loads(request.body.decode("utf-8"))
            name = body.get("name", "")
            ido = body["ido"]
            keido = body["keido"]
            location = Point(keido, ido, srid=4326)
            pin = Pin.objects.create(
                user=request.user,
                name=name,
                location=location,
            )
            return JsonResponse({"status": "success", "id": pin.id})
        except (KeyError, json.JSONDecodeError):
            return HttpResponseBadRequest("Invalid data")
