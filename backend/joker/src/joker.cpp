#include "../include/joker.h"
#include <cstring>
#include <cstdlib>
#include <ctime>
#include <sys/socket.h>
#include <fstream>
#include <algorithm>
#include <random>
#include "../../include/json.hpp"
#include "../../common/include/utils.h"

using namespace std;
using json = nlohmann::json;

bool Joker::loadGameData(const std::string &filepath) {
    try {
        std::ifstream file(filepath);
        if (!file.is_open()) {
            std::cerr << "Error: Could not open file " << filepath << std::endl;
            return false;
        }

        json game_data;
        file >> game_data;
        file.close();

        questions.clear();
        for (const auto &q : game_data["questions"]) {
            common::Question question;
            question.id = q["id"];
            question.text = q["text"];
            question.correct_answer = q["correct_answer"];

            for (const auto &opt : q["options"]) {
                question.options.push_back(opt);
            }

            questions.push_back(question);
        }

        std::cout << "Successfully loaded " << questions.size() << " questions from " << filepath << std::endl;
        return true;
    }
    catch (const std::exception &e) {
        std::cerr << "Error loading game data: " << e.what() << std::endl;
        return false;
    }
}

Joker::Joker() {
    srand(time(nullptr));
    loadGameData("../data/questions.json");
}

Joker::~Joker() {
}

void Joker::register_client(int client_socket, const std::string& websocket_id) {
    clientMap[client_socket] = websocket_id;
    cout << "Client registered with socket: " << client_socket << " and WebSocket ID: " << websocket_id << endl;
    
    string client_id = to_string(client_socket);
    if (userJokerStatus.find(client_id) == userJokerStatus.end()) {
        userJokerStatus[client_id] = map<string, bool>();
        userJokerStatus[client_id]["audience"] = false;
        userJokerStatus[client_id]["50-50"] = false;
    }
}

bool Joker::is_client_registered(int client_socket) {
    return clientMap.find(client_socket) != clientMap.end();
}

void Joker::remove_client(int client_socket) {
    if (clientMap.find(client_socket) != clientMap.end()) {
        clientMap.erase(client_socket);
        
        string client_id = to_string(client_socket);
        if (userJokerStatus.find(client_id) != userJokerStatus.end()) {
            userJokerStatus.erase(client_id);
        }
        
        cout << "Client with socket " << client_socket << " removed from maps" << endl;
    }
}

string Joker::get_fifty_fifty_options(int question_index) {
    std::string result;
    for(const auto& question : questions) {
        if (question.id == question_index) {
            char correct_letter = question.correct_answer[0];
            
            std::vector<char> incorrect_options;
            for (const auto& opt : question.options) {
                if (opt[0] != correct_letter) {
                    incorrect_options.push_back(opt[0]);
                }
            }
            
            std::random_device rd;
            std::mt19937 gen(rd());
            std::uniform_int_distribution<> distrib(0, incorrect_options.size() - 1);
            int random_index = distrib(gen);
            char incorrect_answer = incorrect_options[random_index];

            result = std::string(1, correct_letter) + "," + std::string(1, incorrect_answer);
            break;
        }
    }

    return result;
}

std::string Joker::get_audience_results(int question_index) {
    std::string result;
    for(const auto& question : questions) {
        if (question.id == question_index) {
            char correct_letter = question.correct_answer[0];
            std::vector<std::string> options;
            for (const auto& option : question.options) {
                options.push_back(std::string(1, option[0]));
            }

            std::map<std::string, int> audience_votes;
            std::random_device rd;
            std::mt19937 gen(rd());
            
            for (const auto& option : options) {
                if (option[0] == correct_letter) {
                    std::uniform_int_distribution<> distrib(40, 79);
                    audience_votes[option] = distrib(gen);
                } else {
                    std::uniform_int_distribution<> distrib(0, 39);
                    audience_votes[option] = distrib(gen);
                }
            }

            for (const auto& vote : audience_votes) {
                result += vote.first + ":" + std::to_string(vote.second) + ",";
            }
            if (!result.empty()) {
                result.pop_back();
            }
            break;
        }
    }

    return result;
}

void Joker::process_request(const string& request, int client_socket) {
    cout << "Processing request: " << request << " from socket: " << client_socket << endl;

    auto [action, payload] = common::parseCommand(request);
    
    cout << "Action: " << action << ", payload: " << payload << endl;

    string client_id = to_string(client_socket);
    
    if (userJokerStatus.find(client_id) == userJokerStatus.end()) {
        userJokerStatus[client_id] = std::map<string, bool>();
        cout << "Initialized joker status tracking for client: " << client_id << endl;
    }
    
    if (action == "JOKERS") {
        string available_jokers = "";
        
        if (userJokerStatus.find(client_id) != userJokerStatus.end()) {
            string filtered_jokers = "";
            
            if (userJokerStatus[client_id].find("audience") == userJokerStatus[client_id].end() || 
                !userJokerStatus[client_id]["audience"]) {
                filtered_jokers += "audience";
            }
            
            if (userJokerStatus[client_id].find("50-50") == userJokerStatus[client_id].end() || 
                !userJokerStatus[client_id]["50-50"]) {
                if (!filtered_jokers.empty()) filtered_jokers += ", ";
                filtered_jokers += "50-50";
            }
            
            if (!filtered_jokers.empty()) {
                available_jokers = filtered_jokers;
            }
        }
        cout << "Available jokers " << available_jokers << endl;
        
        string response = "JOKERS:" + available_jokers+ "\n";
                
        send(client_socket, response.c_str(), response.length(), 0);
        cout << "Sent available jokers: " << response << endl;
    }
    else if (action == "JOKER") {
        size_t first_colon_pos = payload.find(':');
        if (first_colon_pos == string::npos) {
            cout << "Invalid payload format in JOKER request: " << payload << endl;
            return;
        }
        
        string question_str = payload.substr(0, first_colon_pos);
        string remaining = payload.substr(first_colon_pos + 1);
        
        size_t second_colon_pos = remaining.find(':');
        string joker_type;
        
        if (second_colon_pos != string::npos) {
            joker_type = remaining.substr(0, second_colon_pos);
        } else {
            joker_type = remaining;
        }
        
        int question_index;
        
        try {
            question_index = stoi(question_str);
        } catch (const exception& e) {
            cout << "Invalid question number in JOKER request: " << question_str << endl;
            return;
        }
    
        
        string result;
        string response_prefix;
        
        if (joker_type == "audience") {
            userJokerStatus[client_id]["audience"] = true;
            cout << "Marked audience joker as used for client: " << client_id << endl;
        
            result = get_audience_results(question_index);
            cout << "Audience results: " << result << endl;
            response_prefix = "AUDIENCE_RESULT";
        
            string formatted_result = ":";
            formatted_result += result;
            result = formatted_result;
        }
        
        else if (joker_type == "50-50") {
            userJokerStatus[client_id]["50-50"] = true;
            cout << "Marked 50-50 joker as used for client: " << client_id << endl;
            
            result = get_fifty_fifty_options(question_index);
            response_prefix = "50-50_RESULT";
            
            string formatted_result = ":";
            
            size_t comma_pos = result.find(',');
            if (comma_pos != string::npos) {
                formatted_result += result.substr(0, comma_pos) + ", " + result.substr(comma_pos + 1);
            } else {
                formatted_result += result;
            }
            
            result = formatted_result;
        }
        else {
            cout << "Unknown joker type: " << joker_type << endl;
            return;
        }
        
        string response = response_prefix + result + "\n";
        send(client_socket, response.c_str(), response.length(), 0);
        cout << "Sent joker results: " << response << endl;
    }
    else if (action == "DISCONNECT") {
        remove_client(client_socket);
    }
    else {
        cout << "Unknown action: " << action << endl;
    }
}
