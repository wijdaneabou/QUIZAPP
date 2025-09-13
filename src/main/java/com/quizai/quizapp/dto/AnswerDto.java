package com.quizai.quizapp.dto;

import com.quizai.quizapp.model.Answer;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;



@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerDto {
    
    private Long id;
    private String answerText;
    private Boolean isCorrect;
    private Integer choiceOrder; 

    public AnswerDto(Answer answer) {
        this.id = answer.getId();
        this.answerText = answer.getAnswerText();
        this.isCorrect = answer.getIsCorrect();
        this.choiceOrder = answer.getChoiceOrder();

    }
    
}