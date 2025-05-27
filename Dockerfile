FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    g++ \
    make \
    libboost-all-dev \
    libjsoncpp-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend /app/backend

COPY build.sh /app/

RUN chmod +x /app/build.sh

RUN cd /app && ./build.sh

EXPOSE 4337

CMD ["/bin/bash", "-c", "cd /app/backend/host && ./game_host & cd /app/backend/joker && ./joker_service"]