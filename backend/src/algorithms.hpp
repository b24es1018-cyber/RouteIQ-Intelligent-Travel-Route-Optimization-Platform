#pragma once

#include "graph.hpp"
#include "optimizer.hpp"
#include <vector>

struct PathResult {
    std::vector<int> path;
    double distanceKm{};
    double cost{};
    double travelHours{};
    long long statesExplored{};
    double executionMs{};
    std::string algorithm;
};

class ShortestPathService {
public:
    explicit ShortestPathService(const Graph& graph);
    PathResult dijkstra(int source, int target) const;
    PathResult aStar(int source, int target) const;
    PathResult bellmanFord(int source, int target) const;

private:
    const Graph& graph_;
    PathResult buildResult(const std::vector<int>& parent, int source, int target, double distance, long long states, const std::string& algorithm) const;
};

class HeldKarpOptimizer {
public:
    explicit HeldKarpOptimizer(const Graph& graph);
    RouteResult solve(const OptimizeRequest& req) const;

private:
    const Graph& graph_;
};

class HeuristicOptimizer {
public:
    explicit HeuristicOptimizer(const Graph& graph);
    RouteResult nearestNeighbor(const OptimizeRequest& req) const;
    RouteResult twoOpt(RouteResult route, double budget) const;
    RouteResult simulatedAnnealing(const OptimizeRequest& req, int iterations = 2500) const;

private:
    const Graph& graph_;
};

class YenTopK {
public:
    explicit YenTopK(const Graph& graph);
    std::vector<RouteResult> routes(const OptimizeRequest& req, int k) const;

private:
    const Graph& graph_;
};

class RecommendationEngine {
public:
    explicit RecommendationEngine(const Graph& graph);
    std::vector<int> recommend(int origin, double budget, int days, const std::vector<std::string>& interests, int limit) const;

private:
    const Graph& graph_;
};
