#include "dijkstra.hpp"
#include <algorithm>
#include <limits>
#include <queue>

ShortestPathResult dijkstraShortestPath(const Graph& graph, int source, int target) {
    const int n = static_cast<int>(graph.places().size());
    const double inf = std::numeric_limits<double>::infinity();
    std::vector<double> dist(n, inf);
    std::vector<int> parent(n, -1);
    using Node = std::pair<double, int>;
    std::priority_queue<Node, std::vector<Node>, std::greater<Node>> pq;

    dist[source] = 0.0;
    pq.push({0.0, source});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d != dist[u]) continue;
        if (u == target) break;
        for (int v = 0; v < n; ++v) {
            if (u == v) continue;
            const double nd = d + graph.distanceKm(u, v);
            if (nd < dist[v]) {
                dist[v] = nd;
                parent[v] = u;
                pq.push({nd, v});
            }
        }
    }

    std::vector<int> path;
    if (dist[target] < inf) {
        for (int cur = target; cur != -1; cur = parent[cur]) path.push_back(cur);
        std::reverse(path.begin(), path.end());
    }
    return {path, dist[target]};
}
