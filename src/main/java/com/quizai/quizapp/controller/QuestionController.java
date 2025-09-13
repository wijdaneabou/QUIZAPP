package com.quizai.quizapp.controller;

import com.quizai.quizapp.dto.QuestionDto;
import com.quizai.quizapp.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "*")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    
    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<QuestionDto>> getQuestionsByQuizId(@PathVariable Long quizId) {
        List<QuestionDto> questions = questionService.getQuestionsByQuizId(quizId);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/batch/{quizId}")
    public ResponseEntity<List<QuestionDto>> createQuestionsBatch(
            @RequestBody List<QuestionDto> questionDtos,
            @PathVariable Long quizId) {
        List<QuestionDto> savedQuestions = questionService.createQuestionsBatch(questionDtos, quizId);
        return ResponseEntity.ok(savedQuestions);
    }
    // Récupérer une question par ID
    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionDto> getQuestionById(@PathVariable Long questionId) {
        QuestionDto question = questionService.getQuestionById(questionId);
        return ResponseEntity.ok(question);
    }

    // Mettre à jour une question (ENDPOINT PRINCIPAL pour votre fonctionnalité)
    @PutMapping("/{questionId}")
    public ResponseEntity<QuestionDto> updateQuestion(
            @PathVariable Long questionId,
            @RequestBody QuestionDto questionDto) {
        QuestionDto updatedQuestion = questionService.updateQuestion(questionId, questionDto);
        return ResponseEntity.ok(updatedQuestion);
    }

    // Supprimer une question
    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId) {
        questionService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }

    // Créer une nouvelle question pour un quiz
    @PostMapping("/quiz/{quizId}")
    public ResponseEntity<QuestionDto> createQuestion(
            @RequestBody QuestionDto questionDto,
            @PathVariable Long quizId) {
        QuestionDto savedQuestion = questionService.createQuestion(questionDto, quizId);
        return ResponseEntity.ok(savedQuestion);
    }
}