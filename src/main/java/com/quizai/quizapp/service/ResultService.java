package com.quizai.quizapp.service;

import com.quizai.quizapp.dto.ResultDto;
import com.quizai.quizapp.model.Result;
import com.quizai.quizapp.model.User;
import com.quizai.quizapp.model.Quiz;
import com.quizai.quizapp.repository.ResultRepository;
import com.quizai.quizapp.repository.UserRepository;
import com.quizai.quizapp.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ResultService {

    @Autowired
    private ResultRepository resultRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizRepository quizRepository;

    public List<ResultDto> getResultsByUserId(Long userId) {
        try {
            List<Result> results = resultRepository.findByUserIdOrderByTakenAtDesc(userId);
            return results.stream()
                    .map(ResultDto::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la récupération des résultats", e);
        }
    }

   // Modifier uniquement la méthode getResultById dans ResultService

    public Optional<ResultDto> getResultById(Long id) {
        try {
            Optional<Result> resultOpt = resultRepository.findById(id);
            
            if (resultOpt.isPresent()) {
                Result result = resultOpt.get();
                
                if (result.getQuiz() != null) {
                        // Charger les questions
                        result.getQuiz().getQuestions().size();
                        
                        // Pour chaque question, charger les réponses
                        if (result.getQuiz().getQuestions() != null) {
                            result.getQuiz().getQuestions().forEach(question -> {
                                question.getAnswers().size(); // Force le chargement
                            });
                        }
                    }
                
                return Optional.of(new ResultDto(result));
            }
            
            return Optional.empty();
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération du résultat: " + e.getMessage());
            return Optional.empty();
        }
    }

    @Transactional
    public ResultDto createResult(Result result, Long userId, Long quizId) {
        System.out.println("🔍 Service - Création résultat:");
        System.out.println("  - User ID: " + userId);
        System.out.println("  - Quiz ID: " + quizId);
        System.out.println("  - Score: " + result.getScore() + "/" + result.getTotal());

        try {

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> {
                        return new RuntimeException("User not found with ID: " + userId);
                    });


            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> {
                        return new RuntimeException("Quiz not found with ID: " + quizId);
                    });

            if (result.getScore() < 0 || result.getTotal() <= 0 || result.getScore() > result.getTotal()) {
                throw new RuntimeException("Données de score invalides: " + result.getScore() + "/" + result.getTotal());
            }

            Result newResult = new Result();
            newResult.setScore(result.getScore());
            newResult.setTotal(result.getTotal());
            
         
            double percentage = (double) result.getScore() / result.getTotal() * 100;
            newResult.setPercentage(Math.round(percentage * 100.0) / 100.0); 
            
            newResult.setUser(user);
            newResult.setQuiz(quiz);
            newResult.setTakenAt(LocalDateTime.now());
            

            Result savedResult = resultRepository.save(newResult);
   
            resultRepository.flush();
            return new ResultDto(savedResult);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la sauvegarde du résultat: " + e.getMessage(), e);
        }
    }

    public Double getAverageScoreByQuizId(Long quizId) {
        try {
            Double average = resultRepository.getAverageScoreByQuizId(quizId);
            return average != null ? Math.round(average * 100.0) / 100.0 : 0.0;
        } catch (Exception e) {
            return 0.0;
        }
    }
}