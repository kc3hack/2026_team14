import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import render,redirect,get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.gis.geos import Point
from django.db import transaction
from .models import Pin,PinImage
from .forms import PinImageFormfrom 
from .enrich import enrich_pin
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
    pins = Pin.objects.all()
    data = [
        {
            "id": pin.id,
            "name": pin.name,
            "ido": pin.location.y,
            "keido": pin.location.x,
            "address": pin.address,
            "description": pin.description,
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
            pin = Pin.objects.create(name=name, location=location)
            transaction.on_commit(lambda: enrich_pin(pin.id))
            return JsonResponse({"status": "success", "id": pin.id})
        except (KeyError, json.JSONDecodeError):
            return HttpResponseBadRequest("Invalid data")
@require_POST
@csrf_exempt
def pin_image_upload(request, pin_id):
    pin = get_object_or_404(Pin, id=pin_id)
    form = PinImageForm(request.POST, request.FILES)
    if not form.is_valid():
        return HttpResponseBadRequest("Invalid form data")
    pin_image = form.save(commit=False)
    pin_image.pin = pin
    pin_image.save()
    return JsonResponse({
        "ok": True,
        "photo":{
            "id": pin_image.id,
            "url": pin_image.image.url,
        }
    })
def api_pin_images(request, pin_id):
    pin = get_object_or_404(Pin, id=pin_id)
    images = [
        {"id": img.id, "url": img.image.url}
        for img in pin.photos.order_by("uploaded_at") 
    ]
    return JsonResponse({"ok": True, "images": images})