package com.quizai.quizapp.controller;

import com.quizai.quizapp.dto.GeneratedQuizDto;
import com.quizai.quizapp.service.QuizService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*") 
@Validated
public class QuizGenerationController {

    private static final Logger logger = LoggerFactory.getLogger(QuizGenerationController.class);

    @Autowired
    private QuizService quizService;

    
    @PostMapping("/generate")
    public Mono<ResponseEntity<Map<String, Object>>> generateQuiz(@Valid @RequestBody GeneratedQuizDto request) {
        logger.info("Demande de génération de quiz reçue: {}", request);
        Long defaultCreatorId = 1L; 

        return generateQuizWithCreator(request, defaultCreatorId);
    }

    @PostMapping("/generate/{creatorId}")
    public Mono<ResponseEntity<Map<String, Object>>> generateQuizWithCreator(
            @Valid @RequestBody GeneratedQuizDto request,
            @PathVariable Long creatorId) {

        logger.info("Génération de quiz pour le créateur {} avec les paramètres: {}", creatorId, request);

        if (creatorId == null || creatorId <= 0) {
            logger.error("ID créateur invalide: {}", creatorId);
            Map<String, Object> errorBody = Map.of("success", false, "error", "ID créateur invalide");
            return Mono.just(ResponseEntity.badRequest().body(errorBody));
        }

      
        String validationError = validateGenerationRequest(request);
        if (validationError != null) {
            logger.error("Erreur de validation de la requête: {}", validationError);
            Map<String, Object> errorBody = Map.of("success", false, "error", validationError);
            return Mono.just(ResponseEntity.badRequest().body(errorBody));
        }

        return quizService.generateAndSaveQuiz(request, creatorId)
                .map(quiz -> {

                    Map<String, Object> response = Map.of(
                            "success", true,
                            "id", quiz.getId(),
                            "title", quiz.getTitle(),
                            "questions", quiz.getQuestions() != null ? quiz.getQuestions() : Collections.emptyList()
                    );
                    
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(this::handleGenerationError); 
    }

  
    private Mono<ResponseEntity<Map<String, Object>>> handleGenerationError(Throwable error) {
        logger.error("Une erreur est survenue durant la génération du quiz: {}", error.getMessage(), error);

        String errorMessage;
        HttpStatus status;

        if (error instanceof IllegalArgumentException) {
            errorMessage = "Données de génération invalides: " + error.getMessage();
            status = HttpStatus.BAD_REQUEST;
        } else if (error.getMessage() != null && error.getMessage().toLowerCase().contains("api")) {
            errorMessage = "Erreur du service IA externe. Veuillez réessayer.";
            status = HttpStatus.SERVICE_UNAVAILABLE;
        } else if (error.getMessage() != null && error.getMessage().toLowerCase().contains("timeout")) {
            errorMessage = "La génération a pris trop de temps (timeout). Veuillez réessayer.";
            status = HttpStatus.REQUEST_TIMEOUT;
        } else {
            errorMessage = "Une erreur technique est survenue lors de la génération du quiz.";
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        Map<String, Object> errorResponse = Map.of(
                "success", false,
                "error", errorMessage,
                "timestamp", LocalDateTime.now().toString()
        );

        return Mono.just(ResponseEntity.status(status).body(errorResponse));
    }

   
    private String validateGenerationRequest(GeneratedQuizDto request) {
        if (request.getNumberOfQuestions() < 1 || request.getNumberOfQuestions() > 50) {
            return "Le nombre de questions doit être compris entre 1 et 50.";
        }
        if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
            return "Le sujet est un champ requis.";
        }
        if (request.getTopic() == null || request.getTopic().trim().isEmpty()) {
            return "Le thème est un champ requis.";
        }
        if (request.getNiveau() == null || request.getNiveau().trim().isEmpty()) {
            return "Le niveau scolaire est un champ requis.";
        }
        if (request.getDifficulty() == null || !List.of("easy", "medium", "hard").contains(request.getDifficulty().toLowerCase())) {
            return "La difficulté spécifiée n'est pas valide (doit être 'easy', 'medium' ou 'hard').";
        }
    
        if (request.getQuestionTypes() != null && !request.getQuestionTypes().isEmpty()) {
            List<String> validTypes = List.of("single_choice", "multiple_choice", "true_false");
            for (String type : request.getQuestionTypes()) {
                if (!validTypes.contains(type)) {
                    return "Type de question invalide: " + type + ". Types acceptés: " + String.join(", ", validTypes);
                }
            }
        }
        
        return null; 
    }

    @GetMapping("/generate/subjects")
    public ResponseEntity<Map<String, Object>> getAvailableSubjects() {
        List<String> subjects = List.of(
                "Mathématiques", "Physique", "Chimie", "SVT", "Histoire", "Géographie", 
                "Français", "Anglais", "Philosophie", "Informatique"
        );
        
        List<String> niveaux = List.of(
                "1ère année collège", "2ème année collège", "3ème année collège",
                "Tronc commun scientifique", "Tronc commun lettres",
                "1ère année baccalauréat", "2ème année baccalauréat"
        );
        
        List<Map<String, String>> questionTypes = List.of(
            Map.of(
                "value", "single_choice", 
                "label", "Choix Unique",
                "description", "4 options, 1 seule bonne réponse"
            ),
            Map.of(
                "value", "multiple_choice", 
                "label", "Choix Multiples",
                "description", "4 options, plusieurs bonnes réponses possibles"
            ),
            Map.of(
                "value", "true_false", 
                "label", "Vrai/Faux",
                "description", "Affirmation à évaluer comme vraie ou fausse"
            )
        );

        Map<String, Object> response = Map.of(
                "subjects", subjects,
                "niveaux", niveaux,
                "difficulties", List.of("easy", "medium", "hard"),
                "questionTypes", questionTypes,
                "maxQuestions", 50,
                "minQuestions", 1
        );

        return ResponseEntity.ok(response);
    }

}