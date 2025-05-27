#ifndef JOKER_H 
#define JOKER_H

#include <string>
#include <netinet/in.h>
#include <map>

class Joker {
private:
    int p; 
    std::string h;
    std::map<std::string, int> client_sockets;
    struct sockaddr_in serv_addr;
    
public:
    bool is_connected = false;
    Joker(std::string host, int port);
    bool connect(const std::string& client_id);
    bool is_client_connected(const std::string& client_id);
    
    std::string forward_request(const std::string& client_id, int question_number, const std::string& joker_type);
    
    void close_connection(const std::string& client_id);
    void close_all_connections();
};

#endif
