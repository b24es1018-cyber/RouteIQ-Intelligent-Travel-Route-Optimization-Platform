#include "data_loader.hpp"
#include <fstream>
#include <nlohmann/json.hpp>

namespace {
using json = nlohmann::json;

std::vector<std::string> stringsFrom(const json& object, const std::string& key) {
    if (!object.contains(key) || !object.at(key).is_array()) return {};
    std::vector<std::string> out;
    for (const auto& value : object.at(key)) {
        if (value.is_string()) out.push_back(value.get<std::string>());
    }
    return out;
}
}

std::vector<Place> loadPlaces(const std::string& path) {
    std::ifstream in(path);
    if (!in) return defaultPlaces();
    json data = json::parse(in, nullptr, false);
    if (data.is_discarded() || !data.is_array()) return defaultPlaces();

    std::vector<Place> places;
    for (const auto& object : data) {
        if (!object.is_object()) continue;
        Place p;
        p.id = object.value("id", static_cast<int>(places.size()));
        p.name = object.value("name", std::string{});
        p.state = object.value("state", std::string{});
        p.lat = object.value("lat", object.value("latitude", 0.0));
        p.lng = object.value("lng", object.value("longitude", 0.0));
        p.category = object.value("category", std::string{"attraction"});
        if (p.category.empty()) p.category = "attraction";
        p.rating = object.value("rating", 4.0);
        if (p.rating == 0) p.rating = 4.0;
        p.cost = object.value("cost", 0.0);
        p.value = object.value("value", 0);
        p.visitHours = object.value("visitHours", 2.0);
        p.interests = stringsFrom(object, "interests");
        p.tags = stringsFrom(object, "tags");
        p.open = object.value("open", std::string{"09:00"});
        p.close = object.value("close", std::string{"18:00"});
        p.imageUrl = object.value("imageUrl", std::string{});
        if (!p.name.empty()) places.push_back(p);
    }
    return places.empty() ? defaultPlaces() : places;
}

std::vector<Place> defaultPlaces() {
    return {
        {0, "Delhi", "Delhi", 28.6139, 77.2090, "city", 4.6, 3000, 85, 7, {"history", "food"}, {"capital"}, "09:00", "18:00", ""},
        {1, "Agra", "Uttar Pradesh", 27.1767, 78.0081, "heritage_site", 4.8, 2500, 95, 6, {"history", "architecture"}, {"unesco"}, "06:00", "19:00", ""},
        {2, "Jaipur", "Rajasthan", 26.9124, 75.7873, "city", 4.7, 2800, 90, 7, {"heritage", "shopping"}, {"palace"}, "09:00", "18:00", ""}
    };
}
