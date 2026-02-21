from django.contrib.gis.db import models
from django.conf import settings
import uuid

class WorldBorder(models.Model):
    # Regular Django fields corresponding to the attributes in the
    # world borders shapefile.
    name = models.CharField(max_length=50)
    area = models.IntegerField()
    pop2005 = models.IntegerField("Population 2005")
    fips = models.CharField("FIPS Code", max_length=2, null=True)
    iso2 = models.CharField("2 Digit ISO", max_length=2)
    iso3 = models.CharField("3 Digit ISO", max_length=3)
    un = models.IntegerField("United Nations Code")
    region = models.IntegerField("Region Code")
    subregion = models.IntegerField("Sub-Region Code")
    lon = models.FloatField()
    lat = models.FloatField()

    # GeoDjango-specific: a geometry field (MultiPolygonField)
    mpoly = models.MultiPolygonField()

    # Returns the string representation of the model.
    def __str__(self):
        return self.name
class Pin(models.Model):
    #ピンに追加したいのがあったらこれに追加
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pins",
        null=True,#追加するときはこれを入れると既存データと衝突しない
        blank=True,
    )
    default_id = models.UUIDField(default=uuid.uuid4,db_index=True,null=True,blank=True)
    
    name = models.CharField(max_length=100, blank=True)
    location = models.PointField(srid=4326)
    address = models.JSONField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    def __str__(self):
        return self.name
class PinImage(models.Model):
    pin = models.ForeignKey(Pin, related_name="photos", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="pins/%Y/%m/%d/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PinImage(pin_id={self.pin_id}, id={self.id})"
worldborders_mapping = {
    "fips": "FIPS",
    "iso2": "ISO2",
    "iso3": "ISO3",
    "un": "UN",
    "name": "NAME",
    "area": "AREA",
    "pop2005": "POP2005",
    "region": "REGION",
    "subregion": "SUBREGION",
    "lon": "LON",
    "lat": "LAT",
    "geom": "MULTIPOLYGON",
}