# Tests

Core C++ algorithm tests live in `backend/tests/algorithm_tests.cpp`.

Recommended API tests:

1. Start `travel_server`.
2. Call `/api/health`.
3. Submit representative bodies to `/api/shortest-path`, `/api/route`, `/api/top-k`, `/api/group-trip`, `/api/recommend`, and `/api/itinerary`.
