package com.quizai.quizapp.repository;

import com.quizai.quizapp.model.Quiz;
import com.quizai.quizapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByCreator(User creator);
    List<Quiz> findBySubjectContainingIgnoreCase(String subject);
    List<Quiz> findByDifficulty(Quiz.Difficulty difficulty);
    
    @Query("SELECT q FROM Quiz q WHERE q.creator.id = :creatorId")
    List<Quiz> findByCreatorId(@Param("creatorId") Long creatorId);

    @Query("SELECT q FROM Quiz q JOIN FETCH q.creator")
    List<Quiz> findAllWithCreator();

}