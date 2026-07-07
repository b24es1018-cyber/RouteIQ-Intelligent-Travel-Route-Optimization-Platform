#pragma once

#include "models.hpp"
#include <string>
#include <vector>

struct Edge {
    int to{};
    double distanceKm{};
    double cost{};
    double travelHours{};
};

class Graph {
public:
    explicit Graph(std::vector<Place> places = {});
    const std::vector<Place>& places() const;
    double distanceKm(int a, int b) const;
    double travelCost(int a, int b) const;
    double travelHours(int a, int b) const;
    const std::vector<std::vector<double>>& weights() const;
    const std::vector<std::vector<Edge>>& adjacencyList() const;
    std::vector<std::vector<double>> adjacencyMatrix() const;
    std::vector<int> bfs(int start) const;
    std::vector<int> dfs(int start) const;
    std::vector<std::vector<int>> connectedComponents() const;
    int size() const;

private:
    std::vector<Place> places_;
    std::vector<std::vector<double>> weights_;
    std::vector<std::vector<Edge>> adjacency_;
    void build();
};

double haversineKm(double lat1, double lon1, double lat2, double lon2);
