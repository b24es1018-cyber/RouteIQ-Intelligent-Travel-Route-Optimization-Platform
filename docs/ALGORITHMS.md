# Algorithm Notes

## Held-Karp Route Optimization

State:

```text
dp[mask][i] = minimum cost to start at source, visit places in mask, and end at candidate i
```

The solver scans all states and returns the highest attraction value whose cost fits budget/time/day constraints. It is exact but exponential, so the API switches to heuristic mode above 18 candidates.

## Large Dataset Heuristics

The large-input pipeline uses:

- value/cost greedy candidate selection
- nearest-neighbor route ordering
- 2-opt local improvement
- simulated annealing for escaping local minima

## Top-K Routes

The top-k service follows Yen's Algorithm principles: generate spur alternatives, reject duplicate route keys, compute set-based diversity, then rank by value, cost, and diversity.

## Itinerary

Itinerary generation uses greedy interval scheduling against each place's opening and closing times, daily available hours, visit duration, and route order.
