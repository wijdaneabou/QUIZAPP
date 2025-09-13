package com.quizai.quizapp.repository;

import com.quizai.quizapp.model.Question;
import com.quizai.quizapp.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByQuizOrderByQuestionOrderAsc(Quiz quiz);
    List<Question> findByQuizIdOrderByQuestionOrderAsc(Long quizId);

}