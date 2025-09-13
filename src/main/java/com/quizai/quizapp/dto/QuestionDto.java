package com.quizai.quizapp.dto;

import com.quizai.quizapp.model.Question;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.stream.Collectors;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    
    private Long id;
    private String questionText;
    private String explanation;
    private Integer questionOrder;
    private Integer points;
    private List<AnswerDto> answers;


    
    public QuestionDto(Question question) {
        this.id = question.getId();
        this.questionText = question.getQuestionText();
        this.explanation = question.getExplanation();
        this.questionOrder = question.getQuestionOrder();
        this.points = question.getPoints();
        this.answers = question.getAnswers() != null ?
                question.getAnswers().stream()
                    .map(AnswerDto::new)
                    .collect(Collectors.toList()) : null;
    }
    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public Integer getQuestionOrder() {
        return questionOrder;
    }

    public void setQuestionOrder(Integer questionOrder) {
        this.questionOrder = questionOrder;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public List<AnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerDto> answers) {
        this.answers = answers;
    }

    // Méthode utile pour la validation
    public boolean isValid() {
        return questionText != null && !questionText.trim().isEmpty() && 
               points != null && points > 0;
    }

    // Méthode pour vérifier qu'il y a au moins une réponse correcte
    public boolean hasCorrectAnswer() {
        return answers != null && answers.stream().anyMatch(AnswerDto::getIsCorrect);
    }

    @Override
    public String toString() {
        return "QuestionDto{" +
                "id=" + id +
                ", questionText='" + questionText + '\'' +
                ", explanation='" + explanation + '\'' +
                ", questionOrder=" + questionOrder +
                ", points=" + points +
                ", answers=" + (answers != null ? answers.size() + " answers" : "no answers") +
                '}';
    }
}