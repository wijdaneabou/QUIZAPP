package com.quizai.quizapp.dto;

import com.quizai.quizapp.model.Quiz;
import java.time.LocalDateTime;
import java.util.List;


public class QuizDto {
    
    private Long id;
    private String title;
    private String subject;
    private String difficulty;
    private String niveau;
    private Integer timeLimit;
    private Boolean isAIGenerated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Long creatorId;
    private String creatorName;
    private Integer questionCount;
    private List<QuestionDto> questions;

    public QuizDto() {}

    public QuizDto(Quiz quiz) {
        if (quiz != null) {
            this.id = quiz.getId();
            this.title = quiz.getTitle();
            this.subject = quiz.getSubject();
            this.niveau = quiz.getNiveau();
            this.timeLimit = quiz.getTimeLimit();
            this.createdAt = quiz.getCreatedAt();
            this.updatedAt = quiz.getUpdatedAt();

            if (quiz.getDifficulty() != null) {
                this.difficulty = quiz.getDifficulty().name();
            }

            this.isAIGenerated = quiz.getIsAIGenerated() != null ? quiz.getIsAIGenerated() : false;

            if (quiz.getCreator() != null) {
                this.creatorId = quiz.getCreator().getId();
                this.creatorName = quiz.getCreator().getName();
            }

            this.questionCount = quiz.getQuestions() != null ? quiz.getQuestions().size() : 0;

             if (quiz.getQuestions() != null) {
            this.questions = quiz.getQuestions().stream()
                .map(QuestionDto::new)
                .collect(java.util.stream.Collectors.toList());
        }
        }
        
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getNiveau() { return niveau; }
    public void setNiveau(String niveau) { this.niveau = niveau; }

    public Integer getTimeLimit() { return timeLimit; }
    public void setTimeLimit(Integer timeLimit) { this.timeLimit = timeLimit; }

    public Boolean getIsAIGenerated() { return isAIGenerated; }
    public void setIsAIGenerated(Boolean isAIGenerated) { this.isAIGenerated = isAIGenerated; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getCreatorId() { return creatorId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }

    public String getCreatorName() { return creatorName; }
    public void setCreatorName(String creatorName) { this.creatorName = creatorName; }

    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }

    public List<QuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<QuestionDto> questions) { this.questions = questions; }

    @Override
    public String toString() {
        return "QuizDto{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", subject='" + subject + '\'' +
                ", difficulty='" + difficulty + '\'' +
                ", niveau='" + niveau + '\'' +
                ", timeLimit=" + timeLimit +
                ", isAIGenerated=" + isAIGenerated +
                ", creatorId=" + creatorId +
                ", questionCount=" + questionCount +
                '}';
    }
}
