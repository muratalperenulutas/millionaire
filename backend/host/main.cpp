#include <iostream>
#include "include/server.h"
#include "include/joker.h"
#include <thread>
#include <csignal>

using namespace std;

#define SERVER_PORT 4337
#define JOKER_PORT 4338
#define JOKER_HOST "127.0.0.1"

Joker* joker = nullptr;

void signalHandler(int signum) {
    cout << "Shutting down... Cleaning up connections." << endl;
    if (joker != nullptr) {
        joker->close_all_connections();
        delete joker;
    }
    exit(signum);
}

int main() {
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);
    
    joker = new Joker(JOKER_HOST, JOKER_PORT);
    
    HostServer server(SERVER_PORT);
    server.setJokerClient(joker);
    
    cout << "Game Host server started on port " << SERVER_PORT << endl;
    cout << "Will connect to Joker service on " << JOKER_HOST << ":" << JOKER_PORT << endl;
    
    server.start();
    
    if (joker != nullptr) {
        joker->close_all_connections();
        delete joker;
    }
    
    return 0;
}
