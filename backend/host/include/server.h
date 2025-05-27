#ifndef HOST_SERVER_H 
#define HOST_SERVER_H

#include <string>
#include <vector>
#include "../../common/include/server_base.h"
#include "../../common/include/question.h"
#include "joker.h"
#include "../../include/json.hpp"

using json = nlohmann::json;

class HostServer : public common::ServerBase {
private:
    json game_data;
    std::vector<common::Question> questions;
    std::vector<common::Question> game_questions;
    Joker* jokerClient;
    bool loadGameData(const std::string& filepath);
    void selectRandomQuestions(int count);
    void handle_client(int client_socket) override;
    
public:
    std::vector<std::string> prizes;
    HostServer(int port);
    void setJokerClient(Joker* joker);
};

#endif
