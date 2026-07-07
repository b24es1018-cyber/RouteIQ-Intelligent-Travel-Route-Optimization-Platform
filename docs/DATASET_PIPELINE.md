# Dataset Pipeline

The backend is designed for thousands of Indian places loaded from local JSON.

Recommended production flow:

1. Download India extracts from Geofabrik.
2. Convert `.osm.pbf` into filtered GeoJSON/CSV with `osmium tags-filter`.
3. Keep nodes/ways matching:
   - `place=city|town`
   - `tourism=attraction|museum|viewpoint`
   - `historic=monument|fort|castle|archaeological_site`
   - `amenity=place_of_worship`
   - `leisure=nature_reserve`
   - `natural=beach|peak|waterfall`
   - `aeroway=aerodrome`
   - `railway=station`
4. Normalize each record to:

```json
{
  "id": 123,
  "name": "Example",
  "state": "Rajasthan",
  "lat": 26.9,
  "lng": 75.7,
  "category": "fort",
  "rating": 4.4,
  "cost": 1200,
  "value": 82,
  "visitHours": 3,
  "interests": ["history", "architecture"],
  "tags": ["historic=fort"],
  "open": "09:00",
  "close": "18:00",
  "imageUrl": ""
}
```

5. Reverse geocode missing states with Nominatim and cache responses.
6. Save to `backend/data/indian_places.json` or set `PLACES_DATASET=/path/to/large.json`.

Do not call Nominatim repeatedly at runtime. Build and cache the dataset offline.
