#ifndef QUESTION_H
#define QUESTION_H

#include <string>
#include <vector>

namespace common {

struct Question {
    int id;
    std::string text;
    std::vector<std::string> options;
    std::string correct_answer;
};

}

#endif