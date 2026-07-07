#include "algorithms.hpp"
#include "data_loader.hpp"
#include "group_trip.hpp"
#include "itinerary.hpp"
#include <cpr/cpr.h>
#include <drogon/drogon.h>
#include <nlohmann/json.hpp>
#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <optional>
#include <set>
#include <unordered_map>

using json = nlohmann::json;

namespace {
json errorBody(const std::string& message) {
    return {{"error", message}};
}

drogon::HttpResponsePtr jsonResponse(const json& body, drogon::HttpStatusCode status = drogon::k200OK) {
    auto res = drogon::HttpResponse::newHttpResponse();
    res->setStatusCode(status);
    res->setContentTypeCode(drogon::CT_APPLICATION_JSON);
    res->setBody(body.dump());
    res->addHeader("Access-Control-Allow-Origin", "*");
    res->addHeader("Access-Control-Allow-Headers", "Content-Type");
    res->addHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    return res;
}

json placeJson(const Place& p) {
    return {
        {"id", p.id}, {"name", p.name}, {"state", p.state}, {"latitude", p.lat}, {"longitude", p.lng},
        {"lat", p.lat}, {"lng", p.lng}, {"category", p.category}, {"rating", p.rating}, {"cost", p.cost},
        {"value", p.value}, {"visitHours", p.visitHours}, {"interests", p.interests}, {"tags", p.tags},
        {"open", p.open}, {"close", p.close}, {"imageUrl", p.imageUrl}
    };
}

json routeJson(const RouteResult& r) {
    return {
        {"route", r.route}, {"cost", r.cost}, {"distanceKm", r.distanceKm}, {"travelHours", r.travelHours},
        {"value", r.value}, {"diversityScore", r.diversityScore}, {"statesExplored", r.statesExplored},
        {"executionMs", r.executionMs}, {"algorithm", r.mode}
    };
}

struct TravelEstimate {
    double distanceKm{};
    double travelHours{};
    std::string provider{"haversine"};
};

std::vector<int> idsFrom(const json& j, const std::string& key) {
    if (!j.contains(key) || !j.at(key).is_array()) return {};
    return j.at(key).get<std::vector<int>>();
}

bool validId(const Graph& graph, int id) {
    return id >= 0 && id < graph.size();
}

std::vector<int> validIdsFrom(const json& j, const std::string& key, const Graph& graph) {
    std::vector<int> ids;
    std::set<int> seen;
    for (int id : idsFrom(j, key)) {
        if (validId(graph, id) && seen.insert(id).second) ids.push_back(id);
    }
    return ids;
}

std::vector<std::string> stringsFrom(const json& j, const std::string& key) {
    if (!j.contains(key) || !j.at(key).is_array()) return {};
    return j.at(key).get<std::vector<std::string>>();
}

json parseBody(const drogon::HttpRequestPtr& req) {
    if (req->body().empty()) return json::object();
    return json::parse(std::string(req->body()), nullptr, true);
}

OptimizeRequest optimizeRequestFrom(const json& body, const Graph& graph) {
    auto candidates = validIdsFrom(body, "candidates", graph);
    const int start = body.value("start", 0);
    if (!validId(graph, start)) throw std::runtime_error("invalid start id");
    if (candidates.empty()) {
        for (const auto& p : graph.places()) {
            if (p.id != start) candidates.push_back(p.id);
        }
    }
    return {
        start,
        candidates,
        body.value("budget", 20000.0),
        body.value("mode", std::string("heuristic")),
        stringsFrom(body, "interests")
    };
}

std::vector<Traveler> travelersFrom(const json& body) {
    std::vector<Traveler> travelers;
    if (!body.contains("travelers") || !body.at("travelers").is_array()) return travelers;
    for (const auto& t : body.at("travelers")) {
        Traveler traveler;
        traveler.name = t.value("name", std::string("Traveler"));
        traveler.budget = t.value("budget", 10000.0);
        traveler.age = t.value("age", 30);
        traveler.availableDays = t.value("availableDays", 3);
        traveler.interests = stringsFrom(t, "interests");
        traveler.preferredCategories = stringsFrom(t, "preferredCategories");
        travelers.push_back(traveler);
    }
    return travelers;
}

double routeDistance(const Graph& graph, const std::vector<int>& route) {
    double total = 0.0;
    for (size_t i = 1; i < route.size(); ++i) total += graph.distanceKm(route[i - 1], route[i]);
    return total;
}

json routesApiStatus() {
    const char* key = std::getenv("GOOGLE_MAPS_API_KEY");
    return {
        {"configured", key && std::string(key).size() > 0},
        {"provider", key && std::string(key).size() > 0 ? "google-routes-ready" : "haversine-fallback"}
    };
}

std::optional<TravelEstimate> googleRoutesEstimate(const Place& origin, const Place& destination) {
    const char* key = std::getenv("GOOGLE_MAPS_API_KEY");
    if (!key || std::string(key).empty()) return std::nullopt;

    json body = {
        {"origin", {{"location", {{"latLng", {{"latitude", origin.lat}, {"longitude", origin.lng}}}}}}},
        {"destination", {{"location", {{"latLng", {{"latitude", destination.lat}, {"longitude", destination.lng}}}}}}},
        {"travelMode", "DRIVE"},
        {"routingPreference", "TRAFFIC_UNAWARE"},
        {"computeAlternativeRoutes", false}
    };
    auto response = cpr::Post(
        cpr::Url{"https://routes.googleapis.com/directions/v2:computeRoutes"},
        cpr::Header{{"Content-Type", "application/json"}, {"X-Goog-Api-Key", key}, {"X-Goog-FieldMask", "routes.distanceMeters,routes.duration"}},
        cpr::Body{body.dump()},
        cpr::Timeout{7000});
    if (response.status_code < 200 || response.status_code >= 300) return std::nullopt;
    auto parsed = json::parse(response.text, nullptr, false);
    if (parsed.is_discarded() || !parsed.contains("routes") || parsed["routes"].empty()) return std::nullopt;
    const auto& route = parsed["routes"][0];
    TravelEstimate estimate;
    estimate.distanceKm = route.value("distanceMeters", 0.0) / 1000.0;
    const std::string duration = route.value("duration", std::string("0s"));
    estimate.travelHours = std::stod(duration.substr(0, duration.size() > 1 ? duration.size() - 1 : duration.size())) / 3600.0;
    estimate.provider = "google-routes";
    return estimate;
}

TravelEstimate estimateForRoute(const Graph& graph, const std::vector<int>& route, bool preferGoogle) {
    TravelEstimate total;
    if (route.size() < 2) return total;
    total.provider = preferGoogle && routesApiStatus()["configured"].get<bool>() ? "google-routes" : "haversine";
    for (size_t i = 1; i < route.size(); ++i) {
        if (preferGoogle) {
            auto estimate = googleRoutesEstimate(graph.places().at(route[i - 1]), graph.places().at(route[i]));
            if (estimate) {
                total.distanceKm += estimate->distanceKm;
                total.travelHours += estimate->travelHours;
                continue;
            }
            total.provider = "haversine-fallback";
        }
        total.distanceKm += graph.distanceKm(route[i - 1], route[i]);
        total.travelHours += graph.travelHours(route[i - 1], route[i]);
    }
    return total;
}
}

int main() {
    using namespace drogon;

    const std::string dataset = std::getenv("PLACES_DATASET") ? std::getenv("PLACES_DATASET") : "data/indian_places.json";
    const auto places = loadPlaces(dataset);
    const Graph graph(places);
    const ShortestPathService shortest(graph);
    const HeldKarpOptimizer exact(graph);
    const HeuristicOptimizer heuristic(graph);
    const YenTopK yen(graph);
    const RecommendationEngine recommender(graph);

    app().registerHandler("/api/health", [](const HttpRequestPtr&, std::function<void(const HttpResponsePtr&)>&& cb) {
        cb(jsonResponse({{"status", "ok"}, {"server", "drogon"}, {"routesApi", routesApiStatus()}}));
    }, {Get, Options});

    app().registerHandler("/api/places", [places](const HttpRequestPtr&, std::function<void(const HttpResponsePtr&)>&& cb) {
        json out = json::array();
        for (const auto& p : places) out.push_back(placeJson(p));
        cb(jsonResponse(out));
    }, {Get, Options});

    app().registerHandler("/api/place/{1}", [places](const HttpRequestPtr&, std::function<void(const HttpResponsePtr&)>&& cb, int id) {
        auto it = std::find_if(places.begin(), places.end(), [&](const Place& p) { return p.id == id; });
        if (it == places.end()) {
            cb(jsonResponse(errorBody("place not found"), k404NotFound));
            return;
        }
        cb(jsonResponse(placeJson(*it)));
    }, {Get, Options});

    app().registerHandler("/api/shortest-path", [graph, shortest](const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            const auto body = parseBody(req);
            const int source = body.value("source", 0);
            const int target = body.value("target", 1);
            if (!validId(graph, source) || !validId(graph, target)) throw std::runtime_error("invalid source or target id");
            const std::string algorithm = body.value("algorithm", std::string("dijkstra"));
            PathResult r = algorithm == "astar" ? shortest.aStar(source, target) :
                           algorithm == "bellman-ford" ? shortest.bellmanFord(source, target) :
                           shortest.dijkstra(source, target);
            const auto estimate = estimateForRoute(graph, r.path, body.value("useGoogleRoutes", true));
            cb(jsonResponse({{"path", r.path}, {"distanceKm", estimate.distanceKm > 0 ? estimate.distanceKm : r.distanceKm},
                             {"travelHours", estimate.travelHours > 0 ? estimate.travelHours : r.travelHours}, {"cost", r.cost},
                             {"travelProvider", estimate.provider},
                             {"algorithm", r.algorithm}, {"statesExplored", r.statesExplored}, {"executionMs", r.executionMs}}));
        } catch (const std::exception& e) {
            cb(jsonResponse(errorBody(e.what()), k400BadRequest));
        }
    }, {Post, Options});

    app().registerHandler("/api/route", [graph, exact, heuristic](const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            const auto body = parseBody(req);
            auto opt = optimizeRequestFrom(body, graph);
            RouteResult r = opt.mode == "exact" && opt.candidates.size() <= 18 ? exact.solve(opt) : heuristic.simulatedAnnealing(opt);
            auto out = routeJson(r);
            const auto estimate = estimateForRoute(graph, r.route, body.value("useGoogleRoutes", true));
            if (estimate.distanceKm > 0) out["distanceKm"] = estimate.distanceKm;
            if (estimate.travelHours > 0) out["travelHours"] = estimate.travelHours;
            out["travelProvider"] = estimate.provider;
            cb(jsonResponse(out));
        } catch (const std::exception& e) {
            cb(jsonResponse(errorBody(e.what()), k400BadRequest));
        }
    }, {Post, Options});

    app().registerHandler("/api/top-k", [graph, yen](const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            const auto body = parseBody(req);
            auto opt = optimizeRequestFrom(body, graph);
            json out;
            out["routes"] = json::array();
            for (const auto& r : yen.routes(opt, body.value("k", 5))) out["routes"].push_back(routeJson(r));
            cb(jsonResponse(out));
        } catch (const std::exception& e) {
            cb(jsonResponse(errorBody(e.what()), k400BadRequest));
        }
    }, {Post, Options});

    app().registerHandler("/api/group-trip", [graph](const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            const auto body = parseBody(req);
            const int start = body.value("start", 0);
            if (!validId(graph, start)) throw std::runtime_error("invalid start id");
            auto candidates = validIdsFrom(body, "candidates", graph);
            if (candidates.empty()) for (const auto& p : graph.places()) candidates.push_back(p.id);
            auto result = planGroupTrip(graph, start, candidates, travelersFrom(body));
            json out;
            out["sharedRoute"] = result.sharedRoute;
            out["travelers"] = json::array();
            for (const auto& t : result.travelers) {
                out["travelers"].push_back({{"name", t.name}, {"sharedRoute", t.sharedRoute}, {"addOns", t.addOns}, {"cost", t.cost}, {"value", t.value}});
            }
            cb(jsonResponse(out));
        } catch (const std::exception& e) {
            cb(jsonResponse(errorBody(e.what()), k400BadRequest));
        }
    }, {Post, Options});

    app().registerHandler("/api/recommend", [graph, recommender](const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            const auto body = parseBody(req);
            const int origin = body.value("origin", 0);
            if (!validId(graph, origin)) throw std::runtime_error("invalid origin id");
            const auto ids = recommender.recommend(origin, body.value("budget", 15000.0), body.value("days", 3), stringsFrom(body, "interests"), body.value("limit", 10));
            json detailed = json::array();
            for (int id : ids) {
                if (validId(graph, id)) detailed.push_back(placeJson(graph.places().at(id)));
            }
            cb(jsonResponse({{"places", ids}, {"results", detailed}}));
        } catch (const std::exception& e) {
            cb(jsonResponse(errorBody(e.what()), k400BadRequest));
        }
    }, {Post, Options});

    app().registerHandler("/api/itinerary", [graph](const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            const auto body = parseBody(req);
            auto days = buildItinerary(graph, idsFrom(body, "route"), body.value("days", 3), body.value("hoursPerDay", 8.0));
            json out;
            out["days"] = json::array();
            for (const auto& d : days) out["days"].push_back({{"day", d.day}, {"places", d.places}, {"usedHours", d.usedHours}, {"travelHours", d.travelHours}});
            cb(jsonResponse(out));
        } catch (const std::exception& e) {
            cb(jsonResponse(errorBody(e.what()), k400BadRequest));
        }
    }, {Post, Options});

    app().registerHandler("/api/search", [places](const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            const auto body = parseBody(req);
            std::string query = body.value("query", std::string(""));
            std::string state = body.value("state", std::string(""));
            std::string category = body.value("category", std::string(""));
            std::transform(state.begin(), state.end(), state.begin(), ::tolower);
            std::transform(category.begin(), category.end(), category.begin(), ::tolower);
            std::transform(query.begin(), query.end(), query.begin(), ::tolower);
            json results = json::array();
            for (const auto& p : places) {
                std::string haystack = p.name + " " + p.state + " " + p.category;
                for (const auto& tag : p.tags) haystack += " " + tag;
                for (const auto& interest : p.interests) haystack += " " + interest;
                std::transform(haystack.begin(), haystack.end(), haystack.begin(), ::tolower);
                std::string placeState = p.state;
                std::string placeCategory = p.category;
                std::transform(placeState.begin(), placeState.end(), placeState.begin(), ::tolower);
                std::transform(placeCategory.begin(), placeCategory.end(), placeCategory.begin(), ::tolower);
                if (!state.empty() && placeState != state) continue;
                if (!category.empty() && placeCategory != category) continue;
                if (p.rating < body.value("rating", 0.0)) continue;
                if (!query.empty() && haystack.find(query) == std::string::npos) continue;
                results.push_back(placeJson(p));
            }
            cb(jsonResponse({{"results", results}}));
        } catch (const std::exception& e) {
            cb(jsonResponse(errorBody(e.what()), k400BadRequest));
        }
    }, {Post, Options});

    app().registerHandler("/api/stats", [graph](const HttpRequestPtr&, std::function<void(const HttpResponsePtr&)>&& cb) {
        long long edges = 0;
        for (const auto& xs : graph.adjacencyList()) edges += static_cast<long long>(xs.size());
        cb(jsonResponse({{"nodes", graph.size()}, {"edges", edges}, {"components", graph.connectedComponents().size()}, {"routesApi", routesApiStatus()}}));
    }, {Get, Options});

    app().registerHandler("/api/benchmark", [graph, shortest, exact, heuristic, yen](const HttpRequestPtr&, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            const int target = graph.size() > 10 ? 10 : std::max(0, graph.size() - 1);
            OptimizeRequest req{0, {}, 50000.0, "heuristic", {}};
            for (int i = 1; i < std::min(graph.size(), 14); ++i) req.candidates.push_back(i);
            const auto dijkstra = shortest.dijkstra(0, target);
            const auto astar = shortest.aStar(0, target);
            const auto bellman = shortest.bellmanFord(0, target);
            auto nearest = heuristic.nearestNeighbor(req);
            auto annealed = heuristic.simulatedAnnealing(req, 500);
            req.mode = "exact";
            auto heldKarp = exact.solve(req);
            auto topRoutes = yen.routes(req, 3);
            cb(jsonResponse({
                {"graph", {{"nodes", graph.size()}, {"edgesPerNode", graph.size() > 0 ? graph.adjacencyList().front().size() : 0}}},
                {"shortestPath", {
                    {{"algorithm", dijkstra.algorithm}, {"executionMs", dijkstra.executionMs}, {"statesExplored", dijkstra.statesExplored}},
                    {{"algorithm", astar.algorithm}, {"executionMs", astar.executionMs}, {"statesExplored", astar.statesExplored}},
                    {{"algorithm", bellman.algorithm}, {"executionMs", bellman.executionMs}, {"statesExplored", bellman.statesExplored}}
                }},
                {"optimizers", {
                    {{"algorithm", nearest.mode}, {"executionMs", nearest.executionMs}, {"value", nearest.value}, {"cost", nearest.cost}},
                    {{"algorithm", annealed.mode}, {"executionMs", annealed.executionMs}, {"value", annealed.value}, {"cost", annealed.cost}},
                    {{"algorithm", heldKarp.mode}, {"executionMs", heldKarp.executionMs}, {"value", heldKarp.value}, {"cost", heldKarp.cost}}
                }},
                {"topKRoutes", topRoutes.size()}
            }));
        } catch (const std::exception& e) {
            cb(jsonResponse(errorBody(e.what()), k400BadRequest));
        }
    }, {Get, Options});

    app().registerHandler("/api/google-routes-status", [](const HttpRequestPtr&, std::function<void(const HttpResponsePtr&)>&& cb) {
        cpr::Response probe;
        cb(jsonResponse({{"routesApi", routesApiStatus()}, {"cprAvailable", true}}));
    }, {Get, Options});

    const int port = std::getenv("PORT") ? std::stoi(std::getenv("PORT")) : 8080;
    std::cout << "Travel Planner API listening on port " << port << "\n";
    app().addListener("0.0.0.0", port).run();
    return 0;
}
