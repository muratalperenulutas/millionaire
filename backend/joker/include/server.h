#ifndef JOKER_SERVER_H 
#define JOKER_SERVER_H

#include "../../common/include/server_base.h"
#include "joker.h"

class JokerServer : public common::ServerBase {
private:
    Joker* jokerService;
    
    void handle_client(int client_socket) override;
    
public:
    JokerServer(int port);
    void setJokerService(Joker* joker);
};

#endif
