package com.quizai.quizapp.repository;

import com.quizai.quizapp.model.Result;
import com.quizai.quizapp.model.User;
import com.quizai.quizapp.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface ResultRepository extends JpaRepository<Result, Long> {
    List<Result> findByUserOrderByTakenAtDesc(User user);
    List<Result> findByQuizOrderByTakenAtDesc(Quiz quiz);

    

    
    @Query("SELECT r FROM Result r JOIN FETCH r.user JOIN FETCH r.quiz WHERE r.user.id = :userId ORDER BY r.takenAt DESC")
     List<Result> findByUserIdOrderByTakenAtDesc(@Param("userId") Long userId);
        
    @Query("SELECT AVG(r.percentage) FROM Result r WHERE r.quiz.id = :quizId")
        Double getAverageScoreByQuizId(@Param("quizId") Long quizId);
    /**
     * Trouver tous les résultats d'un quiz ordonné par date
     */
    @Query("SELECT r FROM Result r WHERE r.quiz.id = :quizId ORDER BY r.takenAt DESC")
    List<Result> findByQuizIdOrderByTakenAtDesc(@Param("quizId") Long quizId);

    /**
     * Compter le nombre d'utilisateurs uniques
     */
    @Query("SELECT COUNT(DISTINCT r.user.id) FROM Result r")
    long countDistinctUserId();

    /**
     * Compter le nombre de quiz uniques
     */
    @Query("SELECT COUNT(DISTINCT r.quiz.id) FROM Result r")
    long countDistinctQuizId();

    /**
     * Calculer la moyenne des pourcentages
     */
    @Query("SELECT AVG(r.percentage) FROM Result r")
    Double findAveragePercentage();

    /**
     * Récupérer tous les résultats avec les détails utilisateur et quiz
     */
    @Query("SELECT r FROM Result r " +
           "LEFT JOIN FETCH r.user " +
           "LEFT JOIN FETCH r.quiz " +
           "ORDER BY r.takenAt DESC")
    List<Result> findAllWithDetails();

    /**
     * Récupérer les statistiques par quiz
     */
    @Query("SELECT new map(" +
           "r.quiz.id as quizId, " +
           "r.quiz.title as quizTitle, " +
           "COUNT(r) as totalAttempts, " +
           "AVG(r.percentage) as averageScore, " +
           "MAX(r.percentage) as bestScore, " +
           "MIN(r.percentage) as worstScore, " +
           "COUNT(DISTINCT r.user.id) as uniqueStudents" +
           ") FROM Result r " +
           "GROUP BY r.quiz.id, r.quiz.title " +
           "ORDER BY COUNT(r) DESC")
    List<Map<String, Object>> getQuizStatistics();
    

}