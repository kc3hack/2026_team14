import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import render,redirect,get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.gis.geos import Point
from django.db import transaction
from .models import Pin,PinImage
from .forms import PinImageForm
from .enrich import enrich_pin
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
import uuid
COOKIE_NAME = "anon_uuid"
COOKIE_MAX_AGE = 60 * 60 * 24 * 365
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
def get_or_set_anon_uuid(request, response=None):
    raw=request.COOKIES.get(COOKIE_NAME)
    if raw:
        try:
            return uuid.UUID(raw)
        except ValueError:
            pass
    new_id = uuid.uuid4()
    if response is not None:
        response.set_cookie(COOKIE_NAME, str(new_id), max_age=COOKIE_MAX_AGE, httponly=True, samesite="Lax")
    return new_id
def pin_get(request):
    resp=JsonResponse({"pins":[]})
    default_id=get_or_set_anon_uuid(request, resp)
    pins = Pin.objects.filter(default_id=default_id)
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
    resp.content=JsonResponse({"pins": data}).content
    return resp
@csrf_exempt
@require_http_methods(["GET", "POST"])
def pins(request):
    if request.method == "GET":
        return pin_get(request)
    resp = JsonResponse({"status": "error"})
    owner = get_or_set_anon_uuid(request, resp)
    if request.method == "POST":
        try:
            body = json.loads(request.body.decode("utf-8"))
            name = body.get("name", "")
            ido = body["ido"]
            keido = body["keido"]
            location = Point(keido, ido, srid=4326)
            pin = Pin.objects.create(
                default_id=owner,
                name=name,
                location=location,
            )
            transaction.on_commit(lambda: enrich_pin(pin.id))
            resp.content = JsonResponse({"status": "success", "id": pin.id}).content
            return resp
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