package com.quizai.quizapp.controller;

import com.quizai.quizapp.dto.AnswerDto;
import com.quizai.quizapp.model.Answer;
import com.quizai.quizapp.service.AnswerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/answers")
@CrossOrigin(origins = "*")
public class AnswerController {
    @Autowired
    private AnswerService answerService;
    
    @GetMapping("/question/{questionId}")
    public List<AnswerDto> getAnswersByQuestionId(@PathVariable Long questionId) {
        return answerService.getAnswersByQuestionId(questionId);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AnswerDto> getAnswerById(@PathVariable Long id) {
        return answerService.getAnswerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/question/{questionId}")
    public AnswerDto createAnswer(@RequestBody Answer answer, @PathVariable Long questionId) {
        return answerService.createAnswer(answer, questionId);
    }
    
    @PutMapping("/{id}")
    public AnswerDto updateAnswer(@PathVariable Long id, @RequestBody Answer answerDetails) {
        return answerService.updateAnswer(id, answerDetails);
    }
    @PutMapping("/question/{questionId}")
    public ResponseEntity<List<AnswerDto>> updateAnswersForQuestion(
            @PathVariable Long questionId,
            @RequestBody List<AnswerDto> answerDtos) {
        try {
            List<AnswerDto> updatedAnswers = answerService.updateAnswersForQuestion(questionId, answerDtos);
            return ResponseEntity.ok(updatedAnswers);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnswer(@PathVariable Long id) {
        answerService.deleteAnswer(id);
        return ResponseEntity.ok().build();
    }
    
}