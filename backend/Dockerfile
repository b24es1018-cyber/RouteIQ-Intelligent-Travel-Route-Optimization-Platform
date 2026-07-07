FROM ubuntu:24.04

RUN apt-get update && apt-get install -y cmake curl g++ git pkg-config libjsoncpp-dev uuid-dev zlib1g-dev openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend /app/backend
RUN cmake -S backend -B backend/build -DCMAKE_BUILD_TYPE=Release && cmake --build backend/build --target travel_server -j2

WORKDIR /app/backend
ENV PORT=8080
ENV PLACES_DATASET=data/indian_places.json
EXPOSE 8080
CMD ["./build/travel_server"]
