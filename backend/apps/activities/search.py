from django.db.models import Q
from django.utils import timezone
from .models import Request
from .metro_nearby import expand_metro_station_ids, nearest_weekend_sat_sun

def search_requests(query: str, filters: dict=None):
    requests = Request.objects.filter(status='active', visibility='public')
    if query:
        requests = requests.filter(Q(title__icontains=query) | Q(description__icontains=query) | Q(activity__name__icontains=query) | Q(location_name__icontains=query))
    metro_line = None
    metro_stations_param = None
    quick_tag = None
    if filters:
        category_id = filters.get('category_id')
        activity_id = filters.get('activity_id')
        request_type = filters.get('request_type')
        level = filters.get('level')
        format_type = filters.get('format')
        metro_line = filters.get('metro_line')
        metro_stations_param = filters.get('metro_stations')
        quick_tag = filters.get('quick_tag')
        if category_id:
            requests = requests.filter(activity__category_id=category_id)
        if activity_id:
            requests = requests.filter(activity_id=activity_id)
        if request_type:
            requests = requests.filter(request_type=request_type)
        if level:
            requests = requests.filter(level=level)
        if format_type:
            requests = requests.filter(format=format_type)
        if quick_tag == 'nearby' and metro_stations_param:
            raw_ids = [s.strip() for s in str(metro_stations_param).split(',') if s.strip()]
            if raw_ids:
                expanded = expand_metro_station_ids(raw_ids, radius=3)
                metro_stations_param = ','.join(expanded)
    if quick_tag == 'today':
        today = timezone.now().date()
        requests = requests.filter(date=today)
    elif quick_tag == 'weekend':
        today = timezone.now().date()
        sat, sun = nearest_weekend_sat_sun(today)
        requests = requests.filter(date__in=[sat, sun])
    uses_metro = bool(metro_line or metro_stations_param)
    if not uses_metro:
        return requests.order_by('-created_at')[:100]
    selected_station_ids = []
    if metro_stations_param:
        selected_station_ids = [s.strip() for s in str(metro_stations_param).split(',') if s.strip()]

    def matches_metro(req):
        stations = getattr(req, 'metro_stations', None) or []

        def station_has_id(station):
            if isinstance(station, dict):
                sid = station.get('id') or station.get('slug') or station.get('code')
                return sid in selected_station_ids if sid else False
            return station in selected_station_ids

        def station_on_line(station):
            if not metro_line:
                return True
            if isinstance(station, dict):
                line = station.get('line') or station.get('line_id')
                return line == metro_line
            return False
        if selected_station_ids:
            if not any((station_has_id(s) for s in stations)):
                return False
        if metro_line:
            if not any((station_on_line(s) for s in stations)):
                return False
        return True
    req_list = list(requests.order_by('-created_at')[:100])
    return [req for req in req_list if matches_metro(req)]