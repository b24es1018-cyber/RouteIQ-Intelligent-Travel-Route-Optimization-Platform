#pragma once

#include "models.hpp"
#include <string>
#include <vector>

std::vector<Place> loadPlaces(const std::string& path);
std::vector<Place> defaultPlaces();
