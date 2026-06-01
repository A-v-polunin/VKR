import json
from datetime import timedelta
from pathlib import Path
_ORDER_CACHE = None

def _load_order():
    global _ORDER_CACHE
    if _ORDER_CACHE is None:
        path = Path(__file__).resolve().parent / 'metro_stations_order.json'
        with open(path, encoding='utf-8') as f:
            _ORDER_CACHE = json.load(f)
    return _ORDER_CACHE

def expand_metro_station_ids(station_ids, radius=3):
    if not station_ids:
        return []
    order_by_line = _load_order()
    out = set(station_ids)
    for sid in station_ids:
        for _line, ordered in order_by_line.items():
            if sid not in ordered:
                continue
            idx = ordered.index(sid)
            start = max(0, idx - radius)
            end = min(len(ordered), idx + radius + 1)
            out.update(ordered[start:end])
            break
    return list(out)

def nearest_weekend_sat_sun(today):
    wd = today.weekday()
    if wd == 5:
        return (today, today + timedelta(days=1))
    if wd == 6:
        return (today - timedelta(days=1), today)
    days_to_sat = 5 - wd
    sat = today + timedelta(days=days_to_sat)
    return (sat, sat + timedelta(days=1))