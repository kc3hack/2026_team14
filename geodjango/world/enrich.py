from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from .models import Pin
from .description import save_pin
geolocator = Nominatim(user_agent="travel_app_test")
reverse = RateLimiter(geolocator.reverse, min_delay_seconds=1,max_retries=2)
def enrich_pin(pin_id):
    pin = Pin.objects.get(id=pin_id)
    if (pin.address is None) or (not isinstance(pin.address, dict)):
        loc = reverse(
            (pin.location.y, pin.location.x),
            language="ja",
            exactly_one=True,
            addressdetails=True,   # ★追加
        )
        raw = loc.raw if loc else {}
        addr = raw.get("address", {})
        if not isinstance(addr, dict):
            addr = {}
        pin.address = addr
        pin.save(update_fields=["address"])
    if not pin.description:
        text = save_pin(pin_id)
        pin.description = text
        pin.save(update_fields=["description"])
