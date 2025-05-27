#include <iostream>
#include "include/server.h"
#include "include/joker.h"
#include <csignal>

using namespace std;

#define SERVER_PORT 4338

Joker* joker = nullptr;

void signalHandler(int signum) {
    cout << "Shutting down... Cleaning up connections." << endl;
    delete joker;
    exit(signum);
}

int main() {
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);
    
    joker = new Joker();
    
    JokerServer server(SERVER_PORT);
    server.setJokerService(joker);
    
    cout << "Joker Service started on port " << SERVER_PORT << endl;
    
    server.start();
    
    delete joker;
    
    return 0;
}
