# API Documentation

All request and response bodies are JSON.

## `POST /api/route`

```json
{
  "start": 0,
  "candidates": [1, 2, 3],
  "budget": 25000,
  "days": 5,
  "mode": "exact",
  "interests": ["history", "nature"]
}
```

Returns route ids, cost, distance, travel hours, total value, algorithm, states explored, and execution time.

## `POST /api/top-k`

Same body as `/api/route`, plus:

```json
{ "k": 5 }
```

Returns unique alternate routes ranked by value, cost, and diversity.

## `POST /api/group-trip`

```json
{
  "start": 0,
  "candidates": [1, 2, 3],
  "travelers": [
    { "name": "Asha", "budget": 20000, "age": 29, "availableDays": 4, "interests": ["history"] }
  ]
}
```

## `POST /api/search`

```json
{
  "query": "fort",
  "state": "Rajasthan",
  "category": "fort",
  "rating": 4.2
}
```
