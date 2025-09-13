package com.quizai.quizapp.controller;

import com.quizai.quizapp.dto.QuizDto;
import com.quizai.quizapp.model.Quiz;
import com.quizai.quizapp.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

class CreateQuizRequest {
    private String title;
    private String subject;
    private String difficulty;
    private String niveau;
    private Integer timeLimit;
    private Boolean isAIGenerated;

    // Getters et setters
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
}

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @GetMapping
    public ResponseEntity<List<QuizDto>> getAllQuizzes() {
        try {
            List<QuizDto> quizzes = quizService.getAllQuizzes();
            return ResponseEntity.ok(quizzes);
        } catch (Exception e) {
            System.err.println("Erreur dans getAllQuizzes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizDto> getQuizById(@PathVariable Long id) {
        try {
            return quizService.getQuizById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("Erreur dans getQuizById: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/creator/{creatorId}")
    public ResponseEntity<List<QuizDto>> getQuizzesByCreator(@PathVariable Long creatorId) {
        try {
            List<QuizDto> quizzes = quizService.getQuizzesByCreator(creatorId);
            return ResponseEntity.ok(quizzes);
        } catch (Exception e) {
            System.err.println("Erreur dans getQuizzesByCreator: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/subject/{subject}")
    public ResponseEntity<List<QuizDto>> getQuizzesBySubject(@PathVariable String subject) {
        try {
            List<QuizDto> quizzes = quizService.getQuizzesBySubject(subject);
            return ResponseEntity.ok(quizzes);
        } catch (Exception e) {
            System.err.println("Erreur dans getQuizzesBySubject: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/difficulty/{difficulty}")
    public ResponseEntity<List<QuizDto>> getQuizzesByDifficulty(@PathVariable Quiz.Difficulty difficulty) {
        try {
            List<QuizDto> quizzes = quizService.getQuizzesByDifficulty(difficulty);
            return ResponseEntity.ok(quizzes);
        } catch (Exception e) {
            System.err.println("Erreur dans getQuizzesByDifficulty: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    @PostMapping(value = "/creator/{creatorId}")
    public ResponseEntity<Map<String, Object>> createQuiz(
            @RequestBody CreateQuizRequest request, 
            @PathVariable Long creatorId) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("🔄 Début création quiz pour créateur: " + creatorId);
            System.out.println("📤 Données reçues: " + request.getTitle());
   
            if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Le titre est requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Le sujet est requis");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (request.getNiveau() == null || request.getNiveau().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Le niveau est requis");
                return ResponseEntity.badRequest().body(response);
            }

            Quiz quiz = new Quiz();
            quiz.setTitle(request.getTitle().trim());
            quiz.setSubject(request.getSubject().trim());
            quiz.setNiveau(request.getNiveau());
            
            // Gestion sécurisée de la difficulté
            if (request.getDifficulty() != null && !request.getDifficulty().trim().isEmpty()) {
                try {
                    quiz.setDifficulty(Quiz.Difficulty.valueOf(request.getDifficulty().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    response.put("success", false);
                    response.put("message", "Difficulté invalide: " + request.getDifficulty());
                    return ResponseEntity.badRequest().body(response);
                }
            } else {
                quiz.setDifficulty(Quiz.Difficulty.EASY);
            }
            
            quiz.setTimeLimit(request.getTimeLimit() != null && request.getTimeLimit() > 0 
                ? request.getTimeLimit() : 30);
            
            // Gestion de l'IA
            quiz.setIsAIGenerated(request.getIsAIGenerated() != null ? request.getIsAIGenerated() : false);

            // Appel du service
            QuizDto createdQuiz = quizService.createQuiz(quiz, creatorId);
            
            System.out.println(" Quiz créé avec ID: " + createdQuiz.getId());
            
    
            response.put("success", true);
            response.put("message", "Quiz créé avec succès");
            response.put("id", createdQuiz.getId());
            response.put("title", createdQuiz.getTitle());
            response.put("subject", createdQuiz.getSubject());
            response.put("niveau", createdQuiz.getNiveau());
            response.put("difficulty", createdQuiz.getDifficulty().toString());
            response.put("timeLimit", createdQuiz.getTimeLimit());
            response.put("isAIGenerated", createdQuiz.getIsAIGenerated());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println(" ERREUR dans createQuiz:");
            System.err.println("Message: " + e.getMessage());
            System.err.println("Type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            
            response.put("success", false);
            response.put("message", "Erreur lors de la création du quiz: " + e.getMessage());
            response.put("error_type", e.getClass().getSimpleName());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateQuiz(@PathVariable Long id, @RequestBody Map<String, Object> updateData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("🔄 Début mise à jour quiz ID: " + id);
            System.out.println("📤 Données reçues: " + updateData);
            
            // Create Quiz object with only the fields that exist in your model
            Quiz quizDetails = new Quiz();
            
            // Map only existing fields safely
            if (updateData.containsKey("title") && updateData.get("title") != null) {
                String title = updateData.get("title").toString().trim();
                if (!title.isEmpty()) {
                    quizDetails.setTitle(title);
                    System.out.println("✓ Title set: " + title);
                }
            }
            
            if (updateData.containsKey("subject") && updateData.get("subject") != null) {
                String subject = updateData.get("subject").toString().trim();
                if (!subject.isEmpty()) {
                    quizDetails.setSubject(subject);
                    System.out.println("✓ Subject set: " + subject);
                }
            }
            
            if (updateData.containsKey("niveau") && updateData.get("niveau") != null) {
                String niveau = updateData.get("niveau").toString().trim();
                if (!niveau.isEmpty()) {
                    quizDetails.setNiveau(niveau);
                    System.out.println("✓ Niveau set: " + niveau);
                }
            }
            
            if (updateData.containsKey("difficulty") && updateData.get("difficulty") != null) {
                String difficultyStr = updateData.get("difficulty").toString().trim().toUpperCase();
                if (!difficultyStr.isEmpty()) {
                    try {
                        Quiz.Difficulty difficulty = Quiz.Difficulty.valueOf(difficultyStr);
                        quizDetails.setDifficulty(difficulty);
                        System.out.println("✓ Difficulty set: " + difficulty);
                    } catch (IllegalArgumentException e) {
                        System.err.println("❌ Invalid difficulty: " + difficultyStr);
                        response.put("success", false);
                        response.put("message", "Difficulté invalide: " + difficultyStr + ". Valeurs acceptées: EASY, MEDIUM, HARD");
                        return ResponseEntity.badRequest().body(response);
                    }
                }
            }
            
            if (updateData.containsKey("timeLimit") && updateData.get("timeLimit") != null) {
                try {
                    Integer timeLimit = null;
                    Object timeLimitObj = updateData.get("timeLimit");
                    
                    if (timeLimitObj instanceof Integer) {
                        timeLimit = (Integer) timeLimitObj;
                    } else if (timeLimitObj instanceof String) {
                        timeLimit = Integer.valueOf(timeLimitObj.toString());
                    } else if (timeLimitObj instanceof Number) {
                        timeLimit = ((Number) timeLimitObj).intValue();
                    }
                    
                    if (timeLimit != null && timeLimit > 0) {
                        quizDetails.setTimeLimit(timeLimit);
                        System.out.println("✓ TimeLimit set: " + timeLimit);
                    }
                } catch (NumberFormatException e) {
                    System.err.println("❌ Invalid timeLimit: " + updateData.get("timeLimit"));
                    response.put("success", false);
                    response.put("message", "Durée invalide: " + updateData.get("timeLimit"));
                    return ResponseEntity.badRequest().body(response);
                }
            }
            
            if (updateData.containsKey("isAIGenerated") && updateData.get("isAIGenerated") != null) {
                Boolean isAIGenerated = null;
                Object aiGenObj = updateData.get("isAIGenerated");
                
                if (aiGenObj instanceof Boolean) {
                    isAIGenerated = (Boolean) aiGenObj;
                } else if (aiGenObj instanceof String) {
                    isAIGenerated = Boolean.valueOf(aiGenObj.toString());
                }
                
                if (isAIGenerated != null) {
                    quizDetails.setAIGenerated(isAIGenerated);
                    System.out.println("✓ IsAIGenerated set: " + isAIGenerated);
                }
            }
            
            // Log what we're about to update
            System.out.println("📝 Quiz details prepared for update:");
            System.out.println("   - Title: " + quizDetails.getTitle());
            System.out.println("   - Subject: " + quizDetails.getSubject());
            System.out.println("   - Niveau: " + quizDetails.getNiveau());
            System.out.println("   - Difficulty: " + quizDetails.getDifficulty());
            System.out.println("   - TimeLimit: " + quizDetails.getTimeLimit());
            System.out.println("   - IsAIGenerated: " + quizDetails.getIsAIGenerated());
            
            // Call service to update
            QuizDto updated = quizService.updateQuiz(id, quizDetails);
            
            if (updated == null) {
                throw new RuntimeException("Échec de la mise à jour - service returned null");
            }
            
            System.out.println("✅ Quiz mis à jour avec succès: " + updated.getId());
            
            response.put("success", true);
            response.put("data", updated);
            response.put("message", "Quiz mis à jour avec succès");
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            System.err.println("❌ Runtime error in updateQuiz: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            
        } catch (Exception e) {
            System.err.println("💥 Unexpected error in updateQuiz: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Erreur inattendue lors de la mise à jour: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteQuiz(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            quizService.deleteQuiz(id);
            response.put("success", true);
            response.put("message", "Quiz supprimé avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Erreur dans deleteQuiz: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Erreur lors de la suppression");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}