package com.quizai.quizapp.repository;

import com.quizai.quizapp.model.Answer;
import com.quizai.quizapp.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByQuestionOrderByChoiceOrderAsc(Question question);
    List<Answer> findByQuestionIdOrderByChoiceOrderAsc(Long questionId);

    
}