#include "../include/server.h"
#include <iostream>
#include <sys/socket.h>
#include <unistd.h>
#include <cstring>
#include <thread>
#include "../../common/include/utils.h"

using namespace std;

Joker* jokerService = nullptr;

JokerServer::JokerServer(int port) : common::ServerBase(port), jokerService(nullptr) {
}

void JokerServer::setJokerService(Joker* joker) {
    jokerService = joker;
}

void JokerServer::handle_client(int client_socket) {
    char buffer[1024] = {0};
    string welcome_msg = "Connected to Joker Server. Ready to process lifeline requests.\n";
    send(client_socket, welcome_msg.c_str(), welcome_msg.length(), 0);

    if (jokerService != nullptr) {
        jokerService->register_client(client_socket, to_string(client_socket));
    }

    while (true) {
        memset(buffer, 0, sizeof(buffer));
        int bytes_read = recv(client_socket, buffer, sizeof(buffer) - 1, 0);
        
        if (bytes_read <= 0) {
            cout << "Client disconnected." << endl;
            
            if (jokerService != nullptr) {
                jokerService->remove_client(client_socket);
            }
            
            break;
        }
        
        string request(buffer);
        cout << "Received request: " << request << endl;
        
        if (jokerService != nullptr) {
            jokerService->process_request(request, client_socket);
        } else {
            cout << "Error: Joker service not initialized!" << endl;
            string error_msg = "ERROR:Joker service not available\n";
            send(client_socket, error_msg.c_str(), error_msg.length(), 0);
        }
    }
    
    close(client_socket);
}
