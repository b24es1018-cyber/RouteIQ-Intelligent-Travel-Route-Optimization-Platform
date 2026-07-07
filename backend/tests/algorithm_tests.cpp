#include "../src/data_loader.hpp"
#include "../src/algorithms.hpp"
#include "../src/dijkstra.hpp"
#include "../src/group_trip.hpp"
#include "../src/itinerary.hpp"
#include "../src/optimizer.hpp"
#include "../src/topk.hpp"
#include <cassert>
#include <iostream>

int main() {
    auto places = defaultPlaces();
    Graph graph(places);
    assert(graph.places().size() >= 3);
    assert(haversineKm(28.6139, 77.2090, 27.1767, 78.0081) > 150.0);
    assert(!graph.bfs(0).empty());
    assert(!graph.dfs(0).empty());
    assert(!graph.connectedComponents().empty());

    auto sp = dijkstraShortestPath(graph, 0, 2);
    assert(!sp.path.empty());
    assert(sp.path.front() == 0 && sp.path.back() == 2);
    ShortestPathService paths(graph);
    assert(!paths.dijkstra(0, 2).path.empty());
    assert(!paths.aStar(0, 2).path.empty());
    assert(!paths.bellmanFord(0, 2).path.empty());

    OptimizeRequest req{0, {1, 2}, 10000, "exact", {}};
    auto exact = optimizeExact(graph, req);
    assert(exact.cost <= req.budget);
    assert(exact.value > 0);
    HeldKarpOptimizer heldKarp(graph);
    assert(heldKarp.solve(req).value > 0);

    req.mode = "heuristic";
    auto heuristic = optimizeHeuristic(graph, req);
    assert(heuristic.cost <= req.budget);
    HeuristicOptimizer heuristics(graph);
    assert(heuristics.simulatedAnnealing(req, 25).cost <= req.budget);

    auto routes = topKRoutes(graph, req, 2);
    assert(!routes.empty());
    assert(!YenTopK(graph).routes(req, 2).empty());

    GroupTripResult group = planGroupTrip(graph, 0, {1, 2}, {{"A", 10000, 30, 3, {"history"}, {"heritage_site"}}, {"B", 9000, 28, 3, {"shopping"}, {"city"}}});
    assert(group.travelers.size() == 2);

    auto days = buildItinerary(graph, exact.route, 2, 8);
    assert(days.size() == 2);
    assert(!RecommendationEngine(graph).recommend(0, 10000, 3, {"history"}, 5).empty());

    std::cout << "All algorithm tests passed\n";
    return 0;
}
