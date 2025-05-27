#ifndef UTILS_H
#define UTILS_H

#include <string>
#include <tuple>

namespace common {

std::tuple<std::string, std::string> parseCommand(const std::string& cmd);

}

#endif