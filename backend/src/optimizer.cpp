#include "optimizer.hpp"
#include <algorithm>
#include <limits>
#include <numeric>
#include <unordered_map>

namespace {
constexpr double kInf = 1e18;

bool better(const RouteResult& a, const RouteResult& b) {
    if (a.value != b.value) return a.value > b.value;
    return a.cost < b.cost;
}
}

double routeCost(const Graph& graph, const std::vector<int>& route) {
    if (route.size() < 2) return 0.0;
    double total = 0.0;
    for (size_t i = 1; i < route.size(); ++i) total += graph.travelCost(route[i - 1], route[i]);
    for (int id : route) {
        if (id != route.front()) total += graph.places()[id].cost;
    }
    return total;
}

int routeValue(const Graph& graph, const std::vector<int>& route) {
    int total = 0;
    for (int id : route) {
        if (id != route.front()) total += graph.places()[id].value;
    }
    return total;
}

RouteResult optimizeExact(const Graph& graph, const OptimizeRequest& req) {
    std::vector<int> nodes;
    for (int id : req.candidates) {
        if (id != req.start && hasInterest(graph.places()[id], req.interests)) nodes.push_back(id);
    }
    if (nodes.size() > 18) return optimizeHeuristic(graph, req);

    const int m = static_cast<int>(nodes.size());
    const int states = 1 << m;
    std::vector<std::vector<double>> dp(states, std::vector<double>(m, kInf));
    std::vector<std::vector<int>> parent(states, std::vector<int>(m, -1));

    for (int i = 0; i < m; ++i) {
        dp[1 << i][i] = graph.travelCost(req.start, nodes[i]) + graph.places()[nodes[i]].cost;
    }
    for (int mask = 1; mask < states; ++mask) {
        for (int i = 0; i < m; ++i) {
            if (!(mask & (1 << i)) || dp[mask][i] >= kInf) continue;
            for (int j = 0; j < m; ++j) {
                if (mask & (1 << j)) continue;
                const int nextMask = mask | (1 << j);
                const double nextCost = dp[mask][i] + graph.travelCost(nodes[i], nodes[j]) + graph.places()[nodes[j]].cost;
                if (nextCost < dp[nextMask][j]) {
                    dp[nextMask][j] = nextCost;
                    parent[nextMask][j] = i;
                }
            }
        }
    }

    RouteResult best;
    best.route = {req.start};
    best.mode = "exact";
    for (int mask = 1; mask < states; ++mask) {
        int value = 0;
        for (int i = 0; i < m; ++i) {
            if (mask & (1 << i)) value += graph.places()[nodes[i]].value;
        }
        for (int end = 0; end < m; ++end) {
            if (!(mask & (1 << end)) || dp[mask][end] > req.budget) continue;
            RouteResult candidate;
            candidate.cost = dp[mask][end];
            candidate.value = value;
            candidate.mode = "exact";
            std::vector<int> rev;
            int curMask = mask;
            int cur = end;
            while (cur != -1) {
                rev.push_back(nodes[cur]);
                const int prev = parent[curMask][cur];
                curMask ^= (1 << cur);
                cur = prev;
            }
            candidate.route = {req.start};
            candidate.route.insert(candidate.route.end(), rev.rbegin(), rev.rend());
            if (better(candidate, best)) best = candidate;
        }
    }
    return best;
}

std::vector<int> twoOpt(const Graph& graph, const std::vector<int>& route) {
    std::vector<int> best = route;
    bool improved = true;
    while (improved) {
        improved = false;
        for (size_t i = 1; i + 2 < best.size(); ++i) {
            for (size_t j = i + 1; j + 1 < best.size(); ++j) {
                auto candidate = best;
                std::reverse(candidate.begin() + static_cast<long>(i), candidate.begin() + static_cast<long>(j + 1));
                if (routeCost(graph, candidate) + 1e-9 < routeCost(graph, best)) {
                    best = candidate;
                    improved = true;
                }
            }
        }
    }
    return best;
}

RouteResult optimizeHeuristic(const Graph& graph, const OptimizeRequest& req) {
    std::vector<int> remaining;
    for (int id : req.candidates) {
        if (id != req.start && hasInterest(graph.places()[id], req.interests)) remaining.push_back(id);
    }
    std::vector<int> selected{req.start};
    double currentCost = 0.0;
    while (!remaining.empty()) {
        int bestId = -1;
        double bestScore = -1.0;
        for (int id : remaining) {
            const double add = graph.travelCost(selected.back(), id) + graph.places()[id].cost;
            if (currentCost + add > req.budget) continue;
            const double score = graph.places()[id].value / std::max(1.0, add);
            if (score > bestScore) {
                bestScore = score;
                bestId = id;
            }
        }
        if (bestId == -1) break;
        currentCost += graph.travelCost(selected.back(), bestId) + graph.places()[bestId].cost;
        selected.push_back(bestId);
        remaining.erase(std::remove(remaining.begin(), remaining.end(), bestId), remaining.end());
    }

    auto improved = twoOpt(graph, selected);
    while (routeCost(graph, improved) > req.budget && improved.size() > 1) improved.pop_back();
    RouteResult result;
    result.route = improved;
    result.cost = routeCost(graph, improved);
    result.distanceKm = 0.0;
    for (size_t i = 1; i < improved.size(); ++i) result.distanceKm += graph.distanceKm(improved[i - 1], improved[i]);
    result.travelHours = 0.0;
    for (size_t i = 1; i < improved.size(); ++i) result.travelHours += graph.travelHours(improved[i - 1], improved[i]);
    result.value = routeValue(graph, improved);
    result.mode = "heuristic";
    return result;
}

RouteResult optimizeRoute(const Graph& graph, const OptimizeRequest& req) {
    if (req.mode == "exact") return optimizeExact(graph, req);
    return optimizeHeuristic(graph, req);
}
