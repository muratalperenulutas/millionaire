#include "../include/server.h"
#include <iostream>
#include <sys/socket.h>
#include <unistd.h>
#include <cstring>
#include <map>
#include <string>
#include <sstream>
#include <fstream>
#include <algorithm>
#include <random>
#include "../../common/include/utils.h"

using namespace std;

const int GAME_QUESTIONS_COUNT = 9;

HostServer::HostServer(int port) : common::ServerBase(port), jokerClient(nullptr) {
    if (!loadGameData("../data/questions.json")) {
        cout << "Warning: Failed to load questions from JSON file, using fallback mode" << endl;
    }
}

void HostServer::selectRandomQuestions(int count) {
    game_questions.clear();
    if (questions.size() <= count) {
        game_questions = questions;
        return;
    }
    
    vector<common::Question> shuffled_questions = questions;
    random_device rd;
    mt19937 g(rd());
    shuffle(shuffled_questions.begin(), shuffled_questions.end(), g);

    for (int i = 0; i < count; i++) {
        game_questions.push_back(shuffled_questions[i]);
    }
    
    cout << "Selected " << game_questions.size() << " questions for the game" << endl;
}

bool HostServer::loadGameData(const string &filepath) {
    try {
        ifstream file(filepath);
        if (!file.is_open()) {
            cerr << "Error: Could not open file " << filepath << endl;
            return false;
        }

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

        prizes.clear();
        for (const auto &prize : game_data["prizes"]) {
            prizes.push_back(prize);
        }

        cout << "Successfully loaded " << questions.size() << " questions from " << filepath << endl;
        return true;
    }
    catch (const exception &e) {
        cerr << "Error loading game data: " << e.what() << endl;
        return false;
    }
}

void HostServer::setJokerClient(Joker *joker) {
    jokerClient = joker;
}

void HostServer::handle_client(int client_socket) {
    int score = 0;
    bool game_over = false;
    int current_question = 0;
    string websocketClientId = to_string(client_socket);

    selectRandomQuestions(GAME_QUESTIONS_COUNT);

    if (jokerClient != nullptr) {
        if (!jokerClient->is_client_connected(websocketClientId)) {
            if (jokerClient->connect(websocketClientId)) {
                cout << "Connected to joker service for client: " << websocketClientId << endl;
            } else {
                cout << "Warning: Failed to connect to joker service for client: " << websocketClientId << endl;
            }
        }
    }

    string welcome_msg = "MESSAGE:Welcome to the game server. You are now connected\n";
    send(client_socket, welcome_msg.c_str(), welcome_msg.length(), 0);

    while (true) {
        char cmd_buffer[1024] = {0};
        int bytes_read = recv(client_socket, cmd_buffer, sizeof(cmd_buffer) - 1, 0);

        if (bytes_read <= 0) {
            cout << "Client " << websocketClientId << " disconnected" << endl;
            if (jokerClient != nullptr) {
                jokerClient->close_connection(websocketClientId);
            }
            break;
        }

        string cmd(cmd_buffer);
        cout << "Received command from " << websocketClientId << ": " << cmd << endl;

        auto [cmdAction, cmdPayload] = common::parseCommand(cmd);

        cout << "DEBUG: Command action: '" << cmdAction << "'" << endl;

        if (cmdAction == "START") {
            cout << "Starting new game for client: " << websocketClientId << endl;

            current_question = 0;
            game_over = false;

            if (current_question < game_questions.size()) {
                stringstream question;
                question << "QUESTION:" << current_question << ":" << game_questions[current_question].text << "@";
                question << "OPTIONS:" << current_question << ":";

                for (size_t j = 0; j < game_questions[current_question].options.size(); j++) {
                    question << game_questions[current_question].options[j];
                    if (j < game_questions[current_question].options.size() - 1) {
                        question << "|";
                    }
                }

                string data_str = question.str() + "\n";
                send(client_socket, data_str.c_str(), data_str.length(), 0);
                cout << "Sent question and options to client: " << websocketClientId << endl;
            } else {
                string error_msg = "ERROR:No questions available\n";
                send(client_socket, error_msg.c_str(), error_msg.length(), 0);
            }
        } else if (cmdAction == "ANSWER") {
            string answer = cmdPayload;

            if (answer.empty() && !cmd.empty()) {
                size_t lastColonPos = cmd.find_last_of(':');
                if (lastColonPos != string::npos && lastColonPos < cmd.length() - 1) {
                    answer = cmd.substr(lastColonPos + 1);
                }
            }

            answer = answer.substr(0, 1);

            if (answer == "A" || answer == "B" || answer == "C" || answer == "D") {
                bool is_correct = false;

                if (current_question < game_questions.size()) {
                    is_correct = (answer == game_questions[current_question].correct_answer);
                }

                if (is_correct) {
                    string correct_msg = "CORRECT:Correct answer!\n";
                    send(client_socket, correct_msg.c_str(), correct_msg.length(), 0);

                    current_question++;

                    if (current_question >= game_questions.size()) {
                        string win_msg = "WIN:Congratulations! You've won the game!\n";
                        send(client_socket, win_msg.c_str(), win_msg.length(), 0);
                        game_over = true;
                    } else {
                        stringstream next_question;
                        next_question << "QUESTION:" << current_question << ":" << game_questions[current_question].text << "@";
                        next_question << "OPTIONS:" << current_question << ":";

                        for (size_t j = 0; j < game_questions[current_question].options.size(); j++) {
                            next_question << game_questions[current_question].options[j];
                            if (j < game_questions[current_question].options.size() - 1) {
                                next_question << "|";
                            }
                        }
                        cout << "DEBUG: Sending next question to client: " << websocketClientId << endl;

                        string next_q_str = next_question.str() + "\n";
                        send(client_socket, next_q_str.c_str(), next_q_str.length(), 0);
                    }
                } else {
                    game_over = true;
                    string wrong_msg = "LOSE:Wrong answer! The correct answer was " +
                                     game_questions[current_question].correct_answer +prizes[score]+ ".\n";
                    send(client_socket, wrong_msg.c_str(), wrong_msg.length(), 0);
                }
            } else {
                string invalid_msg = "ERROR:Invalid answer. Please enter A, B, C, or D.\n";
                send(client_socket, invalid_msg.c_str(), invalid_msg.length(), 0);
            }
        } else if (cmdAction == "JOKER") {
            string jokerType = cmdPayload;

            if (jokerType.empty() && !cmd.empty()) {
                size_t lastColonPos = cmd.find_last_of(':');
                if (lastColonPos != string::npos && lastColonPos < cmd.length() - 1) {
                    jokerType = cmd.substr(lastColonPos + 1);
                }
            }

            if (jokerClient != nullptr) {
                if (!jokerClient->is_client_connected(websocketClientId)) {
                    jokerClient->connect(websocketClientId);
                }
                
                if (jokerClient->is_client_connected(websocketClientId)) {
                    int question_id = game_questions[current_question].id;
                    string joker_response = jokerClient->forward_request(websocketClientId, question_id, jokerType);
                    send(client_socket, joker_response.c_str(), joker_response.length(), 0);
                } else {
                    cout << "Warning: Joker service not connected for client " << websocketClientId << endl;
                    send(client_socket, "ERROR:Joker service not available\n", 35, 0);
                }
            } else {
                cout << "Warning: Joker client is not initialized" << endl;
                send(client_socket, "ERROR:Joker service not available\n", 35, 0);
            }
        } else if (cmdAction == "DISCONNECT") {
            cout << "Client " << websocketClientId << " requested disconnection" << endl;
            if (jokerClient != nullptr) {
                jokerClient->close_connection(websocketClientId);
            }
            break;
        } else {
            cout << "Warning: Unknown command received" << endl;
            send(client_socket, "ERROR:Unknown command\n", 35, 0);
        }

        if (!game_over) {
            if (jokerClient != nullptr) {
                if (!jokerClient->is_client_connected(websocketClientId)) {
                    jokerClient->connect(websocketClientId);
                }
                
                if (jokerClient->is_client_connected(websocketClientId)) {
                    string joker_response = jokerClient->forward_request(websocketClientId, 0, "JOKERS");
                    send(client_socket, joker_response.c_str(), joker_response.length(), 0);
                } else {
                    cout << "Warning: Joker service not connected for client " << websocketClientId << endl;
                    string error_msg = "ERROR:Joker service not available\n";
                    send(client_socket, error_msg.c_str(), error_msg.length(), 0);
                }
            } else {
                cout << "Warning: Joker client is not initialized" << endl;
                string error_msg = "ERROR:Joker service not available\n";
                send(client_socket, error_msg.c_str(), error_msg.length(), 0);
            }
        }

        if (game_over) {
            if (jokerClient != nullptr) {
                jokerClient->close_connection(websocketClientId);
            }
            break;
        }
    }

    close(client_socket);
}
