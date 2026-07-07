#include "itinerary.hpp"

namespace {
int minutes(const std::string& hhmm) {
    if (hhmm.size() < 5) return 0;
    return std::stoi(hhmm.substr(0, 2)) * 60 + std::stoi(hhmm.substr(3, 2));
}
}

std::vector<ItineraryDay> buildItinerary(const Graph& graph, const std::vector<int>& route, int days, double hoursPerDay) {
    std::vector<ItineraryDay> result;
    if (days <= 0) return result;
    result.reserve(days);
    for (int d = 1; d <= days; ++d) result.push_back({d, {}, 0.0});

    int day = 0;
    for (int id : route) {
        const auto& p = graph.places()[id];
        const double openHours = std::max(0, minutes(p.close) - minutes(p.open)) / 60.0;
        const double needed = p.visitHours <= 0 ? 2.0 : p.visitHours;
        if (openHours > 0 && needed > openHours) continue;
        if (result[day].usedHours + needed > hoursPerDay && day + 1 < days) ++day;
        if (result[day].usedHours + needed <= hoursPerDay) {
            result[day].places.push_back(id);
            result[day].usedHours += needed;
        }
    }
    return result;
}
