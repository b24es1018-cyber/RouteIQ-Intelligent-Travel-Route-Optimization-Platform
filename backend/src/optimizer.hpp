#pragma once

#include "graph.hpp"
#include <string>
#include <vector>

struct OptimizeRequest {
    int start{};
    std::vector<int> candidates;
    double budget{};
    std::string mode{"heuristic"};
    std::vector<std::string> interests;
};

RouteResult optimizeExact(const Graph& graph, const OptimizeRequest& req);
RouteResult optimizeHeuristic(const Graph& graph, const OptimizeRequest& req);
RouteResult optimizeRoute(const Graph& graph, const OptimizeRequest& req);
double routeCost(const Graph& graph, const std::vector<int>& route);
int routeValue(const Graph& graph, const std::vector<int>& route);
std::vector<int> twoOpt(const Graph& graph, const std::vector<int>& route);
