#include "graph.hpp"
#include <algorithm>
#include <cmath>
#include <queue>
#include <stack>

namespace {
constexpr double kEarthKm = 6371.0;
constexpr double kPi = 3.14159265358979323846;
constexpr double kAverageRoadKmph = 55.0;
constexpr double kCostPerKm = 8.0;

double radians(double deg) {
    return deg * kPi / 180.0;
}
}

double haversineKm(double lat1, double lon1, double lat2, double lon2) {
    const double dLat = radians(lat2 - lat1);
    const double dLon = radians(lon2 - lon1);
    const double a = std::sin(dLat / 2) * std::sin(dLat / 2) +
                     std::cos(radians(lat1)) * std::cos(radians(lat2)) *
                         std::sin(dLon / 2) * std::sin(dLon / 2);
    return 2 * kEarthKm * std::asin(std::sqrt(a));
}

Graph::Graph(std::vector<Place> places) : places_(std::move(places)) {
    build();
}

const std::vector<Place>& Graph::places() const {
    return places_;
}

double Graph::distanceKm(int a, int b) const {
    return weights_.at(a).at(b);
}

double Graph::travelCost(int a, int b) const {
    return distanceKm(a, b) * kCostPerKm;
}

double Graph::travelHours(int a, int b) const {
    return distanceKm(a, b) / kAverageRoadKmph;
}

const std::vector<std::vector<double>>& Graph::weights() const {
    return weights_;
}

const std::vector<std::vector<Edge>>& Graph::adjacencyList() const {
    return adjacency_;
}

std::vector<std::vector<double>> Graph::adjacencyMatrix() const {
    return weights_;
}

int Graph::size() const {
    return static_cast<int>(places_.size());
}

std::vector<int> Graph::bfs(int start) const {
    std::vector<int> order;
    if (start < 0 || start >= size()) return order;
    std::vector<int> seen(size(), 0);
    std::queue<int> q;
    seen[start] = 1;
    q.push(start);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);
        for (const auto& e : adjacency_[u]) {
            if (!seen[e.to]) {
                seen[e.to] = 1;
                q.push(e.to);
            }
        }
    }
    return order;
}

std::vector<int> Graph::dfs(int start) const {
    std::vector<int> order;
    if (start < 0 || start >= size()) return order;
    std::vector<int> seen(size(), 0);
    std::stack<int> st;
    st.push(start);
    while (!st.empty()) {
        int u = st.top();
        st.pop();
        if (seen[u]) continue;
        seen[u] = 1;
        order.push_back(u);
        for (auto it = adjacency_[u].rbegin(); it != adjacency_[u].rend(); ++it) {
            if (!seen[it->to]) st.push(it->to);
        }
    }
    return order;
}

std::vector<std::vector<int>> Graph::connectedComponents() const {
    std::vector<std::vector<int>> components;
    std::vector<int> seen(size(), 0);
    for (int i = 0; i < size(); ++i) {
        if (seen[i]) continue;
        auto comp = bfs(i);
        for (int id : comp) seen[id] = 1;
        components.push_back(comp);
    }
    return components;
}

void Graph::build() {
    const int n = static_cast<int>(places_.size());
    weights_.assign(n, std::vector<double>(n, 0.0));
    adjacency_.assign(n, {});
    for (int i = 0; i < n; ++i) {
        std::vector<std::pair<double, int>> nearest;
        for (int j = 0; j < n; ++j) {
            if (i != j) {
                weights_[i][j] = haversineKm(places_[i].lat, places_[i].lng, places_[j].lat, places_[j].lng);
                nearest.push_back({weights_[i][j], j});
            }
        }
        std::sort(nearest.begin(), nearest.end());
        const int degree = std::min<int>(24, nearest.size());
        for (int k = 0; k < degree; ++k) {
            int to = nearest[k].second;
            adjacency_[i].push_back({to, weights_[i][to], travelCost(i, to), travelHours(i, to)});
        }
    }
}
