#include "algorithms.hpp"
#include <algorithm>
#include <chrono>
#include <cmath>
#include <limits>
#include <queue>
#include <random>
#include <set>

namespace {
using Clock = std::chrono::steady_clock;
constexpr double kInf = 1e18;

double elapsedMs(Clock::time_point start) {
    return std::chrono::duration<double, std::milli>(Clock::now() - start).count();
}

double distanceOnly(const Graph& graph, const std::vector<int>& route) {
    double total = 0;
    for (size_t i = 1; i < route.size(); ++i) total += graph.distanceKm(route[i - 1], route[i]);
    return total;
}

double hoursOnly(const Graph& graph, const std::vector<int>& route) {
    double total = 0;
    for (size_t i = 1; i < route.size(); ++i) total += graph.travelHours(route[i - 1], route[i]);
    return total;
}

bool routeBetter(const RouteResult& a, const RouteResult& b) {
    if (a.value != b.value) return a.value > b.value;
    if (std::abs(a.cost - b.cost) > 1e-9) return a.cost < b.cost;
    return a.distanceKm < b.distanceKm;
}

std::string routeKey(const std::vector<int>& route) {
    std::string key;
    for (int id : route) key += std::to_string(id) + "-";
    return key;
}

double routeSetDistance(const std::vector<int>& a, const std::vector<int>& b) {
    std::set<int> sa(a.begin() + (a.empty() ? 0 : 1), a.end());
    std::set<int> sb(b.begin() + (b.empty() ? 0 : 1), b.end());
    int inter = 0;
    for (int id : sa) inter += sb.count(id);
    const double uni = static_cast<double>(sa.size() + sb.size() - inter);
    return uni > 0 ? 1.0 - inter / uni : 0.0;
}

double topKScore(const RouteResult& route, double diversity) {
    return route.value * 1000.0 - route.cost + diversity * 350.0 + route.route.size() * 25.0;
}
}

ShortestPathService::ShortestPathService(const Graph& graph) : graph_(graph) {}

PathResult ShortestPathService::buildResult(const std::vector<int>& parent, int source, int target, double distance, long long states, const std::string& algorithm) const {
    std::vector<int> path;
    if (distance < kInf) {
        for (int cur = target; cur != -1; cur = parent[cur]) path.push_back(cur);
        std::reverse(path.begin(), path.end());
    }
    return {path, distance, distance * 8.0, hoursOnly(graph_, path), states, 0.0, algorithm};
}

PathResult ShortestPathService::dijkstra(int source, int target) const {
    const auto started = Clock::now();
    const int n = graph_.size();
    std::vector<double> dist(n, kInf);
    std::vector<int> parent(n, -1);
    std::priority_queue<std::pair<double, int>, std::vector<std::pair<double, int>>, std::greater<std::pair<double, int>>> pq;
    long long states = 0;
    dist[source] = 0;
    pq.push({0, source});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d != dist[u]) continue;
        ++states;
        if (u == target) break;
        for (const auto& e : graph_.adjacencyList()[u]) {
            if (d + e.distanceKm < dist[e.to]) {
                dist[e.to] = d + e.distanceKm;
                parent[e.to] = u;
                pq.push({dist[e.to], e.to});
            }
        }
    }
    auto result = buildResult(parent, source, target, dist[target], states, "Dijkstra");
    result.executionMs = elapsedMs(started);
    return result;
}

PathResult ShortestPathService::aStar(int source, int target) const {
    const auto started = Clock::now();
    const int n = graph_.size();
    std::vector<double> g(n, kInf);
    std::vector<int> parent(n, -1);
    auto h = [&](int id) {
        return graph_.distanceKm(id, target);
    };
    std::priority_queue<std::pair<double, int>, std::vector<std::pair<double, int>>, std::greater<std::pair<double, int>>> open;
    long long states = 0;
    g[source] = 0;
    open.push({h(source), source});
    while (!open.empty()) {
        auto [_, u] = open.top();
        open.pop();
        ++states;
        if (u == target) break;
        for (const auto& e : graph_.adjacencyList()[u]) {
            const double ng = g[u] + e.distanceKm;
            if (ng < g[e.to]) {
                g[e.to] = ng;
                parent[e.to] = u;
                open.push({ng + h(e.to), e.to});
            }
        }
    }
    auto result = buildResult(parent, source, target, g[target], states, "A*");
    result.executionMs = elapsedMs(started);
    return result;
}

PathResult ShortestPathService::bellmanFord(int source, int target) const {
    const auto started = Clock::now();
    const int n = graph_.size();
    std::vector<double> dist(n, kInf);
    std::vector<int> parent(n, -1);
    long long states = 0;
    dist[source] = 0;
    for (int iter = 0; iter < n - 1; ++iter) {
        bool changed = false;
        for (int u = 0; u < n; ++u) {
            if (dist[u] >= kInf) continue;
            for (const auto& e : graph_.adjacencyList()[u]) {
                ++states;
                if (dist[u] + e.distanceKm < dist[e.to]) {
                    dist[e.to] = dist[u] + e.distanceKm;
                    parent[e.to] = u;
                    changed = true;
                }
            }
        }
        if (!changed) break;
    }
    auto result = buildResult(parent, source, target, dist[target], states, "Bellman-Ford");
    result.executionMs = elapsedMs(started);
    return result;
}

HeldKarpOptimizer::HeldKarpOptimizer(const Graph& graph) : graph_(graph) {}

RouteResult HeldKarpOptimizer::solve(const OptimizeRequest& req) const {
    const auto started = Clock::now();
    auto result = optimizeExact(graph_, req);
    result.mode = "Held-Karp DP";
    result.distanceKm = distanceOnly(graph_, result.route);
    result.travelHours = hoursOnly(graph_, result.route);
    result.statesExplored = (req.candidates.size() <= 18) ? (static_cast<long long>(1) << req.candidates.size()) * std::max<size_t>(1, req.candidates.size()) : 0;
    result.executionMs = elapsedMs(started);
    return result;
}

HeuristicOptimizer::HeuristicOptimizer(const Graph& graph) : graph_(graph) {}

RouteResult HeuristicOptimizer::nearestNeighbor(const OptimizeRequest& req) const {
    const auto started = Clock::now();
    auto result = optimizeHeuristic(graph_, req);
    result.mode = "Nearest Neighbor";
    result.distanceKm = distanceOnly(graph_, result.route);
    result.travelHours = hoursOnly(graph_, result.route);
    result.executionMs = elapsedMs(started);
    return result;
}

RouteResult HeuristicOptimizer::twoOpt(RouteResult route, double budget) const {
    const auto started = Clock::now();
    route.route = ::twoOpt(graph_, route.route);
    while (routeCost(graph_, route.route) > budget && route.route.size() > 1) route.route.pop_back();
    route.cost = routeCost(graph_, route.route);
    route.value = routeValue(graph_, route.route);
    route.distanceKm = distanceOnly(graph_, route.route);
    route.travelHours = hoursOnly(graph_, route.route);
    route.mode = "2-opt";
    route.executionMs += elapsedMs(started);
    return route;
}

RouteResult HeuristicOptimizer::simulatedAnnealing(const OptimizeRequest& req, int iterations) const {
    const auto started = Clock::now();
    RouteResult current = twoOpt(nearestNeighbor(req), req.budget);
    RouteResult best = current;
    std::mt19937 rng(42);
    double temperature = 800.0;
    for (int it = 0; it < iterations && current.route.size() > 3; ++it) {
        auto next = current;
        std::uniform_int_distribution<int> dist(1, static_cast<int>(next.route.size()) - 1);
        int a = dist(rng);
        int b = dist(rng);
        if (a > b) std::swap(a, b);
        std::reverse(next.route.begin() + a, next.route.begin() + b + 1);
        next.cost = routeCost(graph_, next.route);
        next.value = routeValue(graph_, next.route);
        if (next.cost <= req.budget) {
            const double delta = (next.value - current.value) * 100.0 - (next.cost - current.cost);
            const double prob = std::exp(delta / std::max(1.0, temperature));
            if (delta > 0 || std::generate_canonical<double, 10>(rng) < prob) current = next;
            if (routeBetter(current, best)) best = current;
        }
        temperature *= 0.995;
    }
    best.mode = "Simulated Annealing";
    best.distanceKm = distanceOnly(graph_, best.route);
    best.travelHours = hoursOnly(graph_, best.route);
    best.executionMs = elapsedMs(started);
    return best;
}

YenTopK::YenTopK(const Graph& graph) : graph_(graph) {}

std::vector<RouteResult> YenTopK::routes(const OptimizeRequest& req, int k) const {
    std::vector<RouteResult> pool;
    std::set<std::string> seen;
    std::vector<int> candidates = req.candidates;
    const int maxAttempts = std::max<int>(k * 10, static_cast<int>(candidates.size()) * 3);
    for (int spur = 0; !candidates.empty() && spur < maxAttempts; ++spur) {
        OptimizeRequest varied = req;
        std::rotate(candidates.begin(), candidates.begin() + 1, candidates.end());
        if (spur > 0 && candidates.size() > 3) {
            const size_t removeAt = static_cast<size_t>(spur) % candidates.size();
            candidates.erase(candidates.begin() + static_cast<long>(removeAt));
        }
        varied.candidates = candidates;
        auto route = req.mode == "exact" && candidates.size() <= 18 ? HeldKarpOptimizer(graph_).solve(varied) : HeuristicOptimizer(graph_).simulatedAnnealing(varied, 700);
        if (route.route.size() < 2 || route.cost > req.budget) continue;
        if (seen.insert(routeKey(route.route)).second) pool.push_back(route);
    }
    if (pool.empty()) {
        auto route = HeuristicOptimizer(graph_).nearestNeighbor(req);
        if (route.route.size() > 1 && route.cost <= req.budget) pool.push_back(route);
    }

    std::sort(pool.begin(), pool.end(), routeBetter);
    std::vector<RouteResult> accepted;
    while (!pool.empty() && static_cast<int>(accepted.size()) < k) {
        auto best = pool.begin();
        double bestScore = -kInf;
        for (auto it = pool.begin(); it != pool.end(); ++it) {
            double diversity = accepted.empty() ? 1.0 : 1.0;
            for (const auto& selected : accepted) diversity = std::min(diversity, routeSetDistance(it->route, selected.route));
            const double score = topKScore(*it, diversity);
            if (score > bestScore) {
                bestScore = score;
                best = it;
            }
        }
        accepted.push_back(*best);
        pool.erase(best);
    }

    for (auto& r : accepted) {
        double bestDistance = 1.0;
        for (const auto& other : accepted) {
            if (&r == &other) continue;
            bestDistance = std::min(bestDistance, routeSetDistance(r.route, other.route));
        }
        r.diversityScore = bestDistance;
    }
    return accepted;
}

RecommendationEngine::RecommendationEngine(const Graph& graph) : graph_(graph) {}

std::vector<int> RecommendationEngine::recommend(int origin, double budget, int days, const std::vector<std::string>& interests, int limit) const {
    std::vector<std::pair<double, int>> scored;
    const double maxHours = std::max(1, days) * 8.0;
    for (const auto& p : graph_.places()) {
        if (p.id == origin || !hasInterest(p, interests)) continue;
        const double cost = graph_.travelCost(origin, p.id) + p.cost;
        const double hours = graph_.travelHours(origin, p.id) + p.visitHours;
        if (cost > budget || hours > maxHours) continue;
        const double score = p.value * 2.0 + p.rating * 10.0 - graph_.distanceKm(origin, p.id) * 0.04 - cost * 0.002;
        scored.push_back({score, p.id});
    }
    std::sort(scored.rbegin(), scored.rend());
    std::vector<int> ids;
    for (const auto& [_, id] : scored) {
        ids.push_back(id);
        if (static_cast<int>(ids.size()) == limit) break;
    }
    return ids;
}
