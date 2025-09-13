package com.quizai.quizapp.dto;

import com.quizai.quizapp.model.Result;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResultDto {
    
    private Long id;
    private int score;
    private int total;
    private double percentage;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime takenAt;
    
    private UserDto user;
    private QuizDto quiz;

    public ResultDto(Result result) {
       
        
        this.id = result.getId();
        this.score = result.getScore();
        this.total = result.getTotal();
        this.percentage = result.getPercentage();
        this.takenAt = result.getTakenAt();
        
       
        try {
            this.user = (result.getUser() != null) ? new UserDto(result.getUser()) : null;
        } catch (Exception e) {
            this.user = null;
        }
        
        try {
            this.quiz = (result.getQuiz() != null) ? new QuizDto(result.getQuiz()) : null;
        } catch (Exception e) {
            this.quiz = null;
        }
    }

    
    public ResultDto(Long id, int score, int total, double percentage, LocalDateTime takenAt) {
        this.id = id;
        this.score = score;
        this.total = total;
        this.percentage = percentage;
        this.takenAt = takenAt;
        this.user = null;
        this.quiz = null;
    }

    public static ResultDto createBasic(Result result) {
        if (result == null) return null;
        
        return new ResultDto(
            result.getId(),
            result.getScore(),
            result.getTotal(),
            result.getPercentage(),
            result.getTakenAt()
        );
    }

    @Override
    public String toString() {
        return String.format("ResultDto{id=%d, score=%d/%d (%.1f%%), takenAt=%s}", 
                           id, score, total, percentage, takenAt);
    }
}