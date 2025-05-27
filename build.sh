#!/bin/bash

echo "Building common components..."
cd backend/common
g++ -c src/*.cpp -I./include
if [ $? -ne 0 ]; then
    echo "Error building common components"
    exit 1
fi

ar rcs libcommon.a *.o
echo "Common components built successfully!"

echo "Building Joker service..."
cd ../joker
g++ -o joker_service main.cpp src/*.cpp ../common/libcommon.a -I./include -I../common/include
if [ $? -ne 0 ]; then
    echo "Error building Joker service"
    exit 1
fi
echo "Joker service built successfully!"

echo "Building Game Host server..."
cd ../host
g++ -o game_host main.cpp src/*.cpp ../common/libcommon.a -I./include -I../common/include
if [ $? -ne 0 ]; then
    echo "Error building Game Host server"
    exit 1
fi
echo "Game Host server built successfully!"

echo "Build completed successfully!"
echo ""
echo "To run the Joker service: cd backend/joker && ./joker_service"
echo "To run the Game Host server: cd backend/host && ./game_host"