#pragma once

#include "optimizer.hpp"
#include <vector>

std::vector<RouteResult> topKRoutes(const Graph& graph, const OptimizeRequest& req, int k);
