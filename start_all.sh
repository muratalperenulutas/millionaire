#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Starting all components for the Millionaire Game...${NC}"

echo -e "${GREEN}Starting Joker Service...${NC}"
cd $(pwd)/backend/joker && ./joker_service &
JOKER_PID=$!
sleep 2
echo -e "${GREEN}Joker Service started with PID: $JOKER_PID${NC}"

echo -e "${GREEN}Starting Game Server...${NC}"
cd $(pwd)/backend/host && ./game_host &
GAME_PID=$!
sleep 2
echo -e "${GREEN}Game Server started with PID: $GAME_PID${NC}"

echo -e "${GREEN}Starting WebSocket Adapter...${NC}"
cd $(pwd)/frontend/src/adapter && node adapter.js &
ADAPTER_PID=$!
sleep 2
echo -e "${GREEN}WebSocket Adapter started with PID: $ADAPTER_PID${NC}"

echo -e "${GREEN}Starting Frontend...${NC}"
cd ${PWD}/frontend && npm run dev &
FRONTEND_PID=$!
sleep 2
echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"

echo -e "${BLUE}All components started successfully!${NC}"
echo -e "${BLUE}Use the following command to stop all components:${NC}"
echo -e "${RED}kill $JOKER_PID $GAME_PID $ADAPTER_PID $FRONTEND_PID${NC}"

echo -e "${BLUE}Press CTRL+C to stop all components${NC}"
trap "kill $JOKER_PID $GAME_PID $ADAPTER_PID $FRONTEND_PID; exit" INT
wait