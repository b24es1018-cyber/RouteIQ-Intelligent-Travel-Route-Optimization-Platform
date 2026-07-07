#include "topk.hpp"
#include <algorithm>
#include <set>

namespace {
std::string keyFor(std::vector<int> route) {
    std::string key;
    for (int id : route) key += std::to_string(id) + ",";
    return key;
}

double jaccardDistance(const std::vector<int>& a, const std::vector<int>& b) {
    std::set<int> sa(a.begin() + (a.empty() ? 0 : 1), a.end());
    std::set<int> sb(b.begin() + (b.empty() ? 0 : 1), b.end());
    int inter = 0;
    for (int x : sa) inter += sb.count(x);
    const int uni = static_cast<int>(sa.size() + sb.size() - inter);
    return uni == 0 ? 0.0 : 1.0 - static_cast<double>(inter) / uni;
}
}

std::vector<RouteResult> topKRoutes(const Graph& graph, const OptimizeRequest& req, int k) {
    std::vector<RouteResult> pool;
    std::set<std::string> seen;
    auto candidates = req.candidates;
    for (size_t seed = 0; seed < candidates.size() && static_cast<int>(pool.size()) < k * 5; ++seed) {
        std::rotate(candidates.begin(), candidates.begin() + 1, candidates.end());
        OptimizeRequest variant = req;
        variant.candidates = candidates;
        variant.mode = req.candidates.size() <= 18 ? req.mode : "heuristic";
        auto route = optimizeRoute(graph, variant);
        if (route.route.size() > 1 && route.cost <= req.budget && !seen.count(keyFor(route.route))) {
            seen.insert(keyFor(route.route));
            pool.push_back(route);
        }
    }
    std::sort(pool.begin(), pool.end(), [&](const RouteResult& a, const RouteResult& b) {
        double da = 0, db = 0;
        for (const auto& r : pool) {
            if (&r != &a) da = std::max(da, jaccardDistance(a.route, r.route));
            if (&r != &b) db = std::max(db, jaccardDistance(b.route, r.route));
        }
        const double sa = a.value * 1000.0 - a.cost + da * 100.0;
        const double sb = b.value * 1000.0 - b.cost + db * 100.0;
        return sa > sb;
    });
    if (static_cast<int>(pool.size()) > k) pool.resize(k);
    return pool;
}
