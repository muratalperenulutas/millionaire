#include <string>
#include <tuple>
#include <iostream>

namespace common {

std::tuple<std::string, std::string> parseCommand(const std::string& cmd) {
    std::string action, payload;
    size_t colonPos = cmd.find(':');
    
    if (colonPos != std::string::npos) {
        action = cmd.substr(0, colonPos);
        if (colonPos < cmd.length() - 1) {
            payload = cmd.substr(colonPos + 1);
        }
    } else {
        action = cmd;
    }
    
    if (!action.empty() && action.back() == '\n') {
        action.pop_back();
    }
    if (!payload.empty() && payload.back() == '\n') {
        payload.pop_back();
    }
    
    return std::make_tuple(action, payload);
}

}