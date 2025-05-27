#ifndef JOKER_H 
#define JOKER_H

#include <iostream>
#include <string>
#include <map>
#include <vector>
#include "../../common/include/question.h"

class Joker {
private:
    std::map<int, std::string> clientMap;
    std::vector<common::Question> questions;
    std::map<std::string, std::map<std::string, bool>> userJokerStatus;
    
    std::string get_audience_results(int question_index);
    std::string get_fifty_fifty_options(int question_index);
    bool loadGameData(const std::string &filepath);

public:
    Joker();
    ~Joker();
    
    void register_client(int client_socket, const std::string& websocket_id);
    void process_request(const std::string& request, int client_socket);
    bool is_client_registered(int client_socket);
    void remove_client(int client_socket);
};

#endif
