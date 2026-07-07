#pragma once

#include "graph.hpp"
#include <vector>

struct ShortestPathResult {
    std::vector<int> path;
    double distanceKm{};
};

ShortestPathResult dijkstraShortestPath(const Graph& graph, int source, int target);
