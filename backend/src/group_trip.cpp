#include "group_trip.hpp"
#include <algorithm>
#include <map>

GroupTripResult planGroupTrip(const Graph& graph, int start, const std::vector<int>& candidates, const std::vector<Traveler>& travelers) {
    std::map<int, int> support;
    double minBudget = travelers.empty() ? 0.0 : travelers.front().budget;
    for (const auto& t : travelers) {
        minBudget = std::min(minBudget, t.budget);
        for (int id : candidates) {
            if (id != start && hasInterest(graph.places()[id], t.interests)) support[id]++;
        }
    }

    std::vector<int> sharedCandidates = candidates;
    std::sort(sharedCandidates.begin(), sharedCandidates.end(), [&](int a, int b) {
        const double scoreA = support[a] * graph.places()[a].value;
        const double scoreB = support[b] * graph.places()[b].value;
        return scoreA > scoreB;
    });
    OptimizeRequest sharedReq{start, sharedCandidates, minBudget * 0.65, "heuristic", {}};
    auto shared = optimizeHeuristic(graph, sharedReq);

    GroupTripResult result;
    result.sharedRoute = shared.route;
    for (const auto& traveler : travelers) {
        std::vector<int> remaining;
        for (int id : candidates) {
            if (std::find(shared.route.begin(), shared.route.end(), id) == shared.route.end() &&
                hasInterest(graph.places()[id], traveler.interests)) {
                remaining.push_back(id);
            }
        }
        const double used = routeCost(graph, shared.route);
        OptimizeRequest personalReq{shared.route.empty() ? start : shared.route.back(), remaining, std::max(0.0, traveler.budget - used), "heuristic", traveler.interests};
        auto personal = optimizeHeuristic(graph, personalReq);
        TravelerPlan plan;
        plan.name = traveler.name;
        plan.sharedRoute = shared.route;
        if (personal.route.size() > 1) plan.addOns.assign(personal.route.begin() + 1, personal.route.end());
        plan.cost = used + personal.cost;
        plan.value = routeValue(graph, shared.route) + routeValue(graph, personal.route);
        result.travelers.push_back(plan);
    }
    return result;
}
