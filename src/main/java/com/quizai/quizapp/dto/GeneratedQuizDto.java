package com.quizai.quizapp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.Valid;
import javax.validation.constraints.*;
import java.util.List;


public class GeneratedQuizDto {

    @Size(min = 2, max = 100, message = "Le sujet doit contenir entre 2 et 100 caractères")
    private String subject;

    @Min(value = 1, message = "Le nombre de questions doit être au minimum de 1")
    @Max(value = 50, message = "Le nombre de questions ne peut pas dépasser 50")
    private int numberOfQuestions;

    @Pattern(regexp = "(?i)(easy|medium|hard)", message = "La difficulté doit être easy, medium ou hard")
    private String difficulty;

    @Size(max = 500, message = "Les instructions ne peuvent pas dépasser 500 caractères")
    private String instructions;

    @Size(max = 100, message = "Le niveau scolaire ne peut pas dépasser 100 caractères")
    private String niveau;

    @Size(min = 2, max = 200, message = "Le thème doit contenir entre 2 et 200 caractères")
    private String topic;

    @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères")
    private String title;

    private List<String> questionTypes;

    @JsonProperty("creatorId")
    private Long creatorId;

    public GeneratedQuizDto() {}

    public GeneratedQuizDto(String subject, int numberOfQuestions, String difficulty) {
        this.subject = subject;
        this.numberOfQuestions = numberOfQuestions;
        this.difficulty = difficulty;
    }

    // Getters et Setters
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public int getNumberOfQuestions() { return numberOfQuestions; }
    public void setNumberOfQuestions(int numberOfQuestions) { this.numberOfQuestions = numberOfQuestions; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getNiveau() { return niveau; }
    public void setNiveau(String niveau) { this.niveau = niveau; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public List<String> getQuestionTypes() { return questionTypes; }
    public void setQuestionTypes(List<String> questionTypes) { this.questionTypes = questionTypes; }
    public Long getCreatorId() { return creatorId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }


    @Override
    public String toString() {
        return "GeneratedQuizDto{" +
                "subject='" + subject + '\'' +
                ", numberOfQuestions=" + numberOfQuestions +
                ", difficulty='" + difficulty + '\'' +
                ", niveau='" + niveau + '\'' +
                ", topic='" + topic + '\'' +
                ", title='" + title + '\'' +
                ", questionTypes=" + questionTypes +
                '}';
    }

    /**
     * Classe interne pour la réponse de l'IA après génération
     */
    public static class GeneratedQuizResponse {
        
        @JsonProperty("id")
        private Long id;
        
        private String title;

        @Valid
        @NotNull(message = "Les questions sont requises")
        @Size(min = 1, message = "Au moins une question est requise")
        private List<GeneratedQuestion> questions;

        public GeneratedQuizResponse() {}

        public GeneratedQuizResponse(String title, List<GeneratedQuestion> questions) {
            this.title = title;
            this.questions = questions;
        }

        // Getters et Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public List<GeneratedQuestion> getQuestions() { return questions; }
        public void setQuestions(List<GeneratedQuestion> questions) { this.questions = questions; }

        @Override
        public String toString() {
            return "GeneratedQuizResponse{" +
                    "id=" + id +
                    ", title='" + title + '\'' +
                    ", questions=" + (questions != null ? questions.size() : 0) + " questions" +
                    '}';
        }
    }

    /**
     * Classe interne représentant une question générée par l'IA
     */
    public static class GeneratedQuestion {
        
        @Size(min = 5, max = 1000, message = "La question doit contenir entre 5 et 1000 caractères")
        private String question;

        @NotNull(message = "Les options sont requises")
        @Size(min = 2, max = 6, message = "Il doit y avoir entre 2 et 6 options")
        private List<String> options;
        @JsonProperty("correct_answer")
        private Integer correctAnswer;

        @JsonProperty("correct_answers")
        private List<Integer> correctAnswers;

        @Size(max = 500, message = "L'explication ne peut pas dépasser 500 caractères")
        private String explanation;

        @Pattern(regexp = "(?i)(single_choice|multiple_choice|true_false)", 
                message = "Le type doit être single_choice, multiple_choice ou true_false")
        private String type = "single_choice";

       
        public GeneratedQuestion() {}

        public GeneratedQuestion(String question, List<String> options, int correctAnswer, String explanation) {
            this.question = question;
            this.options = options;
            this.correctAnswer = correctAnswer;
            this.explanation = explanation;
            this.type = "single_choice";
        }

        public GeneratedQuestion(String question, List<String> options, List<Integer> correctAnswers, String explanation, String type) {
            this.question = question;
            this.options = options;
            this.correctAnswers = correctAnswers;
            this.explanation = explanation;
            this.type = type;
        }

        // Getters et Setters
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public List<String> getOptions() { return options; }
        public void setOptions(List<String> options) { this.options = options; }
        public Integer getCorrectAnswer() { return correctAnswer; }
        public void setCorrectAnswer(Integer correctAnswer) { this.correctAnswer = correctAnswer; }
        public List<Integer> getCorrectAnswers() { return correctAnswers; }
        public void setCorrectAnswers(List<Integer> correctAnswers) { this.correctAnswers = correctAnswers; }
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        
        public boolean isValidCorrectAnswer() {
            if (options == null) return false;
            
            switch (type.toLowerCase()) {
                case "true_false":
                    if (options.size() != 2) return false;
                    if (correctAnswer != null) {
                        return correctAnswer >= 0 && correctAnswer <= 1;
                    }
                    if (correctAnswers != null && correctAnswers.size() == 1) {
                        return correctAnswers.get(0) >= 0 && correctAnswers.get(0) <= 1;
                    }
                    return false;
                    
                case "single_choice":
                    if (correctAnswer != null) {
                        return correctAnswer >= 0 && correctAnswer < options.size();
                    }
                    if (correctAnswers != null && correctAnswers.size() == 1) {
                        return correctAnswers.get(0) >= 0 && correctAnswers.get(0) < options.size();
                    }
                    return false;
                    
                case "multiple_choice":
                    if (correctAnswers != null && !correctAnswers.isEmpty()) {
                        return correctAnswers.stream().allMatch(idx -> idx >= 0 && idx < options.size());
                    }
                 
                    if (correctAnswer != null) {
                        return correctAnswer >= 0 && correctAnswer < options.size();
                    }
                    return false;
                    
                default:
                    return false;
            }
        }

       
        public List<Integer> getAllCorrectAnswers() {
            if (correctAnswers != null && !correctAnswers.isEmpty()) {
                return correctAnswers;
            }
            if (correctAnswer != null) {
                return List.of(correctAnswer);
            }
            return List.of();
        }

        @Override
        public String toString() {
            return "GeneratedQuestion{" +
                    "question='" + question + '\'' +
                    ", type='" + type + '\'' +
                    ", options=" + (options != null ? options.size() : 0) + " options" +
                    ", correctAnswer=" + correctAnswer +
                    ", correctAnswers=" + correctAnswers +
                    ", explanation='" + explanation + '\'' +
                    '}';
        }
    }
}