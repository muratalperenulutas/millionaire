#include <iostream>
#include <unistd.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include "../include/joker.h"

using namespace std;

Joker::Joker(string host, int port) {
    p = port;
    h = host;
    is_connected = false;
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(p);

    if (inet_pton(AF_INET, h.c_str(), &serv_addr.sin_addr) <= 0) {
        perror("Invalid address / Address not supported");
        return;
    }
}

bool Joker::connect(const string& client_id) {
    int new_sock;
    if ((new_sock = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
        perror("Socket creation failed");
        return false;
    }

    if (::connect(new_sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0) {
        perror("Connection to joker server failed");
        close(new_sock);
        return false;
    }

    client_sockets[client_id] = new_sock;
    
    cout << "Connected to joker server at " << h << ":" << p << " for client " << client_id << endl;
    is_connected = true;
    
    char buffer[1024] = {0};
    read(new_sock, buffer, sizeof(buffer));
    cout << "Joker server message for client " << client_id << ": " << buffer << endl;
    
    return true;
}

bool Joker::is_client_connected(const string& client_id) {
    return client_sockets.find(client_id) != client_sockets.end();
}

string Joker::forward_request(const string& client_id, int question_number, const string& joker_type) {
    if (!is_client_connected(client_id)) {
        if (!connect(client_id)) {
            return "ERROR:Could not connect to joker server";
        }
    }
    
    int client_sock = client_sockets[client_id];
    
    string request;
    if (joker_type == "JOKERS") {
        request = "JOKERS";
    } else {
        request = "JOKER:" + to_string(question_number) + ":" + joker_type + ":" + client_id + "\n";
    }
    
    send(client_sock, request.c_str(), request.length(), 0);

    char buffer[1024] = {0};
    int bytes_read = read(client_sock, buffer, sizeof(buffer));
    
    if (bytes_read <= 0) {
        close_connection(client_id);
        return "ERROR:Failed to receive response from joker server";
    }

    string response = string(buffer);
    
    return response;
}

void Joker::close_connection(const string& client_id) {
    auto it = client_sockets.find(client_id);
    if (it != client_sockets.end()) {
        close(it->second);
        client_sockets.erase(it);
        cout << "Disconnected from joker server for client " << client_id << endl;
    }
}

void Joker::close_all_connections() {
    for (auto& [client_id, sock] : client_sockets) {
        close(sock);
        cout << "Disconnected from joker server for client " << client_id << endl;
    }
    client_sockets.clear();
    is_connected = false;
}
