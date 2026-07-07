#pragma once

#include "graph.hpp"
#include <vector>

std::vector<ItineraryDay> buildItinerary(const Graph& graph, const std::vector<int>& route, int days, double hoursPerDay);
