#pragma once

#include <map>
#include <string>
#include <vector>

enum class PlaceCategory {
    City,
    Town,
    Attraction,
    Monument,
    Museum,
    Temple,
    Fort,
    NationalPark,
    Beach,
    Waterfall,
    HillStation,
    HeritageSite,
    Airport,
    RailwayStation,
    Unknown
};

struct Place {
    int id{};
    std::string name;
    std::string state;
    double lat{};
    double lng{};
    std::string category{"attraction"};
    double rating{4.0};
    double cost{};
    int value{};
    double visitHours{};
    std::vector<std::string> interests;
    std::vector<std::string> tags;
    std::string open;
    std::string close;
    std::string imageUrl;
};

struct RouteResult {
    std::vector<int> route;
    double cost{};
    double distanceKm{};
    double travelHours{};
    int value{};
    double diversityScore{};
    long long statesExplored{};
    double executionMs{};
    std::string mode;
};

struct Traveler {
    std::string name;
    double budget{};
    int age{};
    int availableDays{};
    std::vector<std::string> interests;
    std::vector<std::string> preferredCategories;
};

struct TravelerPlan {
    std::string name;
    std::vector<int> sharedRoute;
    std::vector<int> addOns;
    double cost{};
    int value{};
};

struct GroupTripResult {
    std::vector<int> sharedRoute;
    std::vector<TravelerPlan> travelers;
};

struct ItineraryDay {
    int day{};
    std::vector<int> places;
    double usedHours{};
    double travelHours{};
};

inline bool hasInterest(const Place& place, const std::vector<std::string>& interests) {
    if (interests.empty()) return true;
    for (const auto& a : place.interests) {
        for (const auto& b : interests) {
            if (a == b) return true;
        }
    }
    return false;
}
