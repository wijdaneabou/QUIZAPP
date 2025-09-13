package com.quizai.quizapp.service;

import com.quizai.quizapp.dto.AnswerDto;
import com.quizai.quizapp.model.Answer;
import com.quizai.quizapp.model.Question;
import com.quizai.quizapp.repository.AnswerRepository;
import com.quizai.quizapp.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AnswerService {

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    public List<AnswerDto> getAnswersByQuestionId(Long questionId) {
        return answerRepository.findByQuestionIdOrderByChoiceOrderAsc(questionId).stream()
                .map(AnswerDto::new)
                .collect(Collectors.toList());
    }

    public Optional<AnswerDto> getAnswerById(Long id) {
        return answerRepository.findById(id).map(AnswerDto::new);
    }

    public AnswerDto createAnswer(Answer answer, Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        answer.setQuestion(question);
        Answer savedAnswer = answerRepository.save(answer);
        return new AnswerDto(savedAnswer);
    }

    public AnswerDto updateAnswer(Long id, Answer answerDetails) {
        Answer answer = answerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Answer not found"));

        answer.setAnswerText(answerDetails.getAnswerText());
        answer.setIsCorrect(answerDetails.getIsCorrect());
        answer.setChoiceOrder(answerDetails.getChoiceOrder());

        Answer updatedAnswer = answerRepository.save(answer);
        return new AnswerDto(updatedAnswer);
    }

    public void deleteAnswer(Long id) {
        answerRepository.deleteById(id);
    }
   public List<AnswerDto> updateAnswersForQuestion(Long questionId, List<AnswerDto> newAnswers) {
    // Supprimer les anciennes réponses - UTILISEZ LA BONNE MÉTHODE
    List<Answer> existingAnswers = answerRepository.findByQuestionIdOrderByChoiceOrderAsc(questionId);
    answerRepository.deleteAll(existingAnswers);
    
    // Créer les nouvelles réponses
    List<Answer> answersToSave = new ArrayList<>();
    for (int i = 0; i < newAnswers.size(); i++) {
        AnswerDto dto = newAnswers.get(i);
        Answer answer = new Answer();
        answer.setAnswerText(dto.getAnswerText());
        answer.setIsCorrect(dto.getIsCorrect());
        answer.setChoiceOrder(i + 1);
        
        // Récupérer la question
        Question question = questionRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Question not found"));
        answer.setQuestion(question);
        
        answersToSave.add(answer);
    }
    
    List<Answer> savedAnswers = answerRepository.saveAll(answersToSave);
    
    // CORRIGÉ - utilisez AnswerDto::new au lieu de convertToDto
    return savedAnswers.stream()
            .map(AnswerDto::new)
            .collect(Collectors.toList());
}

}
