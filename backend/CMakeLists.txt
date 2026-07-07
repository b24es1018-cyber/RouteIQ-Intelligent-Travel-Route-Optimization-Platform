cmake_minimum_required(VERSION 3.16)
project(travel_optimizer_backend LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

include(FetchContent)
set(FETCHCONTENT_QUIET OFF)

find_package(Jsoncpp QUIET)
if (NOT Jsoncpp_FOUND)
    set(JSONCPP_WITH_TESTS OFF CACHE BOOL "" FORCE)
    set(JSONCPP_WITH_POST_BUILD_UNITTEST OFF CACHE BOOL "" FORCE)
    set(JSONCPP_WITH_WARNING_AS_ERROR OFF CACHE BOOL "" FORCE)
    set(JSONCPP_WITH_STRICT_ISO OFF CACHE BOOL "" FORCE)
    set(JSONCPP_WITH_PKGCONFIG_SUPPORT OFF CACHE BOOL "" FORCE)
    set(JSONCPP_WITH_CMAKE_PACKAGE OFF CACHE BOOL "" FORCE)
    FetchContent_Declare(
        jsoncpp
        GIT_REPOSITORY https://github.com/open-source-parsers/jsoncpp.git
        GIT_TAG 1.9.6
        GIT_SHALLOW TRUE
    )
    FetchContent_MakeAvailable(jsoncpp)
    set(JSONCPP_INCLUDE_DIRS "${jsoncpp_SOURCE_DIR}/include" CACHE PATH "jsoncpp include dir" FORCE)
    set(JSONCPP_LIBRARIES jsoncpp_static CACHE STRING "jsoncpp library" FORCE)
endif()

find_package(Drogon QUIET)
if (NOT Drogon_FOUND)
    set(BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
    set(BUILD_CTL OFF CACHE BOOL "" FORCE)
    set(BUILD_ORM OFF CACHE BOOL "" FORCE)
    set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
    FetchContent_Declare(
        drogon
        GIT_REPOSITORY https://github.com/drogonframework/drogon.git
        GIT_TAG v1.9.11
        GIT_SHALLOW TRUE
    )
    FetchContent_MakeAvailable(drogon)
endif()

find_package(nlohmann_json QUIET)
if (NOT nlohmann_json_FOUND)
    FetchContent_Declare(
        nlohmann_json
        URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
    )
    FetchContent_MakeAvailable(nlohmann_json)
endif()

find_package(cpr QUIET)
if (NOT cpr_FOUND)
    set(CPR_BUILD_TESTS OFF CACHE BOOL "" FORCE)
    set(CPR_BUILD_TESTS_SSL OFF CACHE BOOL "" FORCE)
    FetchContent_Declare(
        cpr
        GIT_REPOSITORY https://github.com/libcpr/cpr.git
        GIT_TAG 1.10.5
        GIT_SHALLOW TRUE
    )
    FetchContent_MakeAvailable(cpr)
endif()

add_library(travel_core
    src/algorithms.cpp
    src/graph.cpp
    src/dijkstra.cpp
    src/optimizer.cpp
    src/topk.cpp
    src/group_trip.cpp
    src/itinerary.cpp
    src/data_loader.cpp
)
target_include_directories(travel_core PUBLIC src)
target_link_libraries(travel_core PUBLIC nlohmann_json::nlohmann_json)

add_executable(travel_server src/main.cpp)
target_link_libraries(travel_server PRIVATE travel_core)

find_package(Threads REQUIRED)
target_link_libraries(travel_server PRIVATE Threads::Threads)
if (TARGET Drogon::Drogon)
    target_link_libraries(travel_server PRIVATE Drogon::Drogon)
elseif (TARGET drogon)
    target_link_libraries(travel_server PRIVATE drogon)
else()
    message(FATAL_ERROR "Drogon target not found")
endif()
target_link_libraries(travel_server PRIVATE nlohmann_json::nlohmann_json cpr::cpr)

add_executable(algorithm_tests tests/algorithm_tests.cpp)
target_link_libraries(algorithm_tests PRIVATE travel_core)
enable_testing()
add_test(NAME algorithm_tests COMMAND algorithm_tests)
