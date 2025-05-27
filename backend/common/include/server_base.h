#ifndef SERVER_BASE_H
#define SERVER_BASE_H

#include <string>
#include <netinet/in.h>
#include <functional>

namespace common {

class ServerBase {
protected:
    int port;  
    int server_fd, new_socket;
    struct sockaddr_in address;
    
    virtual void handle_client(int client_socket) = 0;

public:
    ServerBase(int port);
    virtual ~ServerBase();
    
    void start();
};

}

#endif