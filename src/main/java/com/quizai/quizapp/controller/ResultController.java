package com.quizai.quizapp.controller;

import com.quizai.quizapp.dto.QuizDto;
import com.quizai.quizapp.dto.ResultDto;
import com.quizai.quizapp.model.Result;
import com.quizai.quizapp.service.ResultService;
import com.quizai.quizapp.service.QuizService;
import com.quizai.quizapp.repository.ResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ResultController {

    @Autowired
    private ResultService resultService;

    @Autowired
    private QuizService quizService;

    @Autowired
    private ResultRepository resultRepository;

    // =============== UTILISATEUR  ===============

    @GetMapping("/results/user/{userId}")
    public ResponseEntity<?> getResultsByUserId(@PathVariable String userId) {
        try {
            Long userIdLong;
            try {
                userIdLong = Long.parseLong(userId);
            } catch (NumberFormatException e) {
                userIdLong = (long) userId.hashCode();
                if (userIdLong < 0) userIdLong = -userIdLong;
            }
            
            List<ResultDto> results = resultService.getResultsByUserId(userIdLong);
           
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Erreur lors de la récupération des résultats", e.getMessage()));
        }
    }

    @GetMapping("/results/{id}")
    public ResponseEntity<?> getResultById(@PathVariable Long id) {
        try {
            System.out.println("🔍 Récupération du résultat ID: " + id);
            return resultService.getResultById(id)
                    .map(result -> {
                        return ResponseEntity.ok(result);
                    })
                    .orElseGet(() -> {
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Erreur lors de la récupération du résultat", e.getMessage()));
        }
    }
    public static class CreateResultRequest {
        private Integer score;
        private Integer total;
        private Double percentage;
        
        
        public CreateResultRequest() {}
        
        public CreateResultRequest(Integer score, Integer total, Double percentage) {
            this.score = score;
            this.total = total;
            this.percentage = percentage;
        }
        
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
        
        public Integer getTotal() { return total; }
        public void setTotal(Integer total) { this.total = total; }
        
        public Double getPercentage() { return percentage; }
        public void setPercentage(Double percentage) { this.percentage = percentage; }
        
        @Override
        public String toString() {
            return "CreateResultRequest{score=" + score + ", total=" + total + ", percentage=" + percentage + "}";
        }
    }

    @PostMapping("/results/user/{userId}/quiz/{quizId}")
    public ResponseEntity<?> createResult(
            @Valid @RequestBody CreateResultRequest request, 
            @PathVariable String userId, 
            @PathVariable Long quizId) {
        
        if (userId == null || quizId == null) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("User ID et Quiz ID sont requis", "Paramètres manquants"));
        }

        if (request == null) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Données du résultat requises", "Body de la requête vide"));
        }

        // Validation des données du résultat
        if (request.getScore() == null || request.getScore() < 0) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Score invalide", "Le score ne peut pas être négatif ou null"));
        }

        if (request.getTotal() == null || request.getTotal() <= 0) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Total invalide", "Le total doit être supérieur à 0"));
        }

        if (request.getScore() > request.getTotal()) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Score invalide", "Le score ne peut pas être supérieur au total"));
        }

        try {
            Long userIdLong;
            try {
                userIdLong = Long.parseLong(userId);
            } catch (NumberFormatException e) {
                userIdLong = (long) userId.hashCode();
                if (userIdLong < 0) userIdLong = -userIdLong; 
            }
            
            Result result = new Result();
            result.setScore(request.getScore());
            result.setTotal(request.getTotal());
            result.setPercentage(request.getPercentage());
            
            ResultDto savedResult = resultService.createResult(result, userIdLong, quizId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedResult);
            
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("Erreur de validation", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Erreur interne du serveur", e.getMessage()));
        }
    }

    @PostMapping("/results/user/{userId}/quiz/{quizId}/simple")
    public ResponseEntity<?> createResultSimple(
            @PathVariable String userId, 
            @PathVariable Long quizId,
            @RequestParam Integer score,
            @RequestParam Integer total,
            @RequestParam(required = false) Double percentage) {
        

        if (score == null || score < 0) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Score invalide", "Le score ne peut pas être négatif ou null"));
        }

        if (total == null || total <= 0) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Total invalide", "Le total doit être supérieur à 0"));
        }

        if (score > total) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Score invalide", "Le score ne peut pas être supérieur au total"));
        }

        try {
            Long userIdLong;
            try {
                userIdLong = Long.parseLong(userId);
            } catch (NumberFormatException e) {
                userIdLong = (long) userId.hashCode();
                if (userIdLong < 0) userIdLong = -userIdLong; 
            }
            
            Result result = new Result();
            result.setScore(score);
            result.setTotal(total);
            result.setPercentage(percentage != null ? percentage : (score * 100.0 / total));
            
            ResultDto savedResult = resultService.createResult(result, userIdLong, quizId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedResult);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Erreur interne du serveur", e.getMessage()));
        }
    }

    @GetMapping("/results/quiz/{quizId}/average")
    public ResponseEntity<?> getAverageScoreByQuizId(@PathVariable Long quizId) {
        try {
            Double average = resultService.getAverageScoreByQuizId(quizId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("quizId", quizId);
            response.put("average", average);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Erreur lors du calcul de la moyenne", e.getMessage()));
        }
    }

    // =============== ADMIN ===============


    @GetMapping("/admin/results/all")
    public ResponseEntity<?> getAllResultsForAdmin() {
        try {
            List<Result> allResults = resultRepository.findAllWithDetails();

            List<Map<String, Object>> enrichedResults = allResults.stream()
                .map(result -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", result.getId());
                    dto.put("score", result.getScore());
                    dto.put("total", result.getTotal());
                    dto.put("percentage", result.getPercentage());
                    dto.put("maxScore", result.getTotal()); 
                    dto.put("completedAt", result.getTakenAt());
                    dto.put("timeTaken", 0); 
                    if (result.getUser() != null) {
                        dto.put("studentName", result.getUser().getName());
                        dto.put("studentEmail", result.getUser().getEmail());
                    } else {
                        dto.put("studentName", "Utilisateur inconnu");
                        dto.put("studentEmail", "Email inconnu");
                    }
                    if (result.getQuiz() != null) {
                        dto.put("quizTitle", result.getQuiz().getTitle());
                    } else {
                        dto.put("quizTitle", "Quiz inconnu");
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
            return ResponseEntity.ok(enrichedResults);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Erreur lors de la récupération des résultats", e.getMessage()));
        }
    }

  
    @GetMapping("/admin/results/statistics")
    public ResponseEntity<?> getStatisticsForAdmin() {
        try {
            System.out.println("🔍 Admin - Calcul des statistiques");
            
            Map<String, Object> statistics = new HashMap<>();
            long totalResults = resultRepository.count();
            long totalStudents = resultRepository.countDistinctUserId();
            long totalQuizzes = resultRepository.countDistinctQuizId();
            Double averageScore = resultRepository.findAveragePercentage();
            
            statistics.put("totalResults", totalResults);
            statistics.put("totalStudents", totalStudents); 
            statistics.put("totalQuizzes", totalQuizzes);
            statistics.put("averageScore", averageScore != null ? Math.round(averageScore * 100.0) / 100.0 : 0.0);
            return ResponseEntity.ok(statistics);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Erreur lors du calcul des statistiques", e.getMessage()));
        }
    }

   
    @GetMapping("/admin/quiz")
    public ResponseEntity<?> getAllQuizzesForAdmin() {
        try {
            System.out.println("🔍 Admin - Récupération de tous les quiz");
            
            List<QuizDto> quizzes = quizService.getAllQuizzes();
            return ResponseEntity.ok(quizzes);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Erreur lors de la récupération des quiz", e.getMessage()));
        }
    }

   
    @GetMapping("/admin/results/quiz/{quizId}")
    public ResponseEntity<?> getResultsByQuizForAdmin(@PathVariable Long quizId) {
        try {
            List<Result> results = resultRepository.findByQuizIdOrderByTakenAtDesc(quizId);
            List<Map<String, Object>> enrichedResults = results.stream()
                .map(result -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", result.getId());
                    dto.put("score", result.getScore());
                    dto.put("total", result.getTotal());
                    dto.put("percentage", result.getPercentage());
                    dto.put("maxScore", result.getTotal());
                    dto.put("completedAt", result.getTakenAt());
                    dto.put("timeTaken", 0);
                    
                    if (result.getUser() != null) {
                        dto.put("studentName", result.getUser().getName());
                        dto.put("studentEmail", result.getUser().getEmail());
                    } else {
                        dto.put("studentName", "Utilisateur inconnu");
                        dto.put("studentEmail", "Email inconnu");
                    }
                    
                    if (result.getQuiz() != null) {
                        dto.put("quizTitle", result.getQuiz().getTitle());
                    } else {
                        dto.put("quizTitle", "Quiz inconnu");
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
            return ResponseEntity.ok(enrichedResults);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Erreur lors de la récupération des résultats du quiz", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/results/{resultId}")
    public ResponseEntity<?> deleteResultForAdmin(@PathVariable Long resultId) {
        try {  
            if (!resultRepository.existsById(resultId)) {
                return ResponseEntity.notFound().build();
            }
            
            resultRepository.deleteById(resultId);
            
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Erreur lors de la suppression du résultat", e.getMessage()));
        }
    }
    private Map<String, Object> createErrorResponse(String message, String details) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", true);
        errorResponse.put("message", message);
        errorResponse.put("details", details);
        errorResponse.put("timestamp", System.currentTimeMillis());
        return errorResponse;
    }
}