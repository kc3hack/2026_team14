from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from .models import Pin
geolocator = Nominatim(user_agent="travel_app_test")
reverse = RateLimiter(geolocator.reverse, min_delay_seconds=1,max_retries=2)
def enrich_pin(pin_id):
    pin = Pin.objects.get(id=pin_id)
    if not pin.address:
        loc=reverse((pin.location.y, pin.location.x), language="ja")
        raw=loc.raw
        address=raw.get("display_name", "")
        pin.address=address
        pin.save(update_fields=["address"])
    if not pin.description:
        address = pin.address
        pin.description = f"この場所の住所は「{address}」です。"
        pin.save(update_fields=["description"])
