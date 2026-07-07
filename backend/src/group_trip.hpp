#pragma once

#include "optimizer.hpp"

GroupTripResult planGroupTrip(const Graph& graph, int start, const std::vector<int>& candidates, const std::vector<Traveler>& travelers);
