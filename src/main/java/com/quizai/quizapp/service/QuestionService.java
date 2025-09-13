package com.quizai.quizapp.service;

import com.quizai.quizapp.dto.QuestionDto;
import com.quizai.quizapp.model.Question;
import com.quizai.quizapp.model.Answer;
import com.quizai.quizapp.model.Quiz;
import com.quizai.quizapp.repository.QuestionRepository;
import com.quizai.quizapp.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuizRepository quizRepository;
    
    // Méthodes existantes
    public List<Question> getQuestionsByQuizIdRaw(Long quizId) {
        return questionRepository.findByQuizIdOrderByQuestionOrderAsc(quizId);
    }
    
    public List<QuestionDto> createQuestionsBatch(List<QuestionDto> questionDtos, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz not found with id " + quizId));

        List<Question> questions = questionDtos.stream()
            .map(dto -> convertToEntity(dto, quiz))
            .collect(Collectors.toList());

        List<Question> savedQuestions = questionRepository.saveAll(questions);
        
        return savedQuestions.stream()
            .map(QuestionDto::new)
            .collect(Collectors.toList());
    }

    public List<QuestionDto> getQuestionsByQuizId(Long quizId) {
        return questionRepository.findByQuizIdOrderByQuestionOrderAsc(quizId)
                .stream()
                .map(QuestionDto::new)
                .toList();
    }

    // NOUVELLES MÉTHODES NÉCESSAIRES :

    // Récupérer une question par ID
    public QuestionDto getQuestionById(Long questionId) {
        Question question = questionRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Question not found with id " + questionId));
        return new QuestionDto(question);
    }

    // Mettre à jour une question (MÉTHODE PRINCIPALE pour votre fonctionnalité)
    public QuestionDto updateQuestion(Long questionId, QuestionDto questionDto) {
        Question existingQuestion = questionRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Question not found with id " + questionId));

        // Mettre à jour les champs de la question
        existingQuestion.setQuestionText(questionDto.getQuestionText());
        existingQuestion.setPoints(questionDto.getPoints());
        existingQuestion.setExplanation(questionDto.getExplanation());
    

        // Optionnel: mettre à jour l'ordre si fourni
        if (questionDto.getQuestionOrder() != null) {
            existingQuestion.setQuestionOrder(questionDto.getQuestionOrder());
        }

        Question savedQuestion = questionRepository.save(existingQuestion);
        return new QuestionDto(savedQuestion);
    }

    // Supprimer une question
    public void deleteQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Question not found with id " + questionId));
        
        questionRepository.delete(question);
    }

    // Créer une nouvelle question pour un quiz
    public QuestionDto createQuestion(QuestionDto questionDto, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz not found with id " + quizId));

        Question question = convertToEntity(questionDto, quiz);
        Question savedQuestion = questionRepository.save(question);
        
        return new QuestionDto(savedQuestion);
    }

    // Méthode helper existante
    private Question convertToEntity(QuestionDto dto, Quiz quiz) {
        Question question = new Question();
        question.setQuestionText(dto.getQuestionText());
        question.setExplanation(dto.getExplanation());
        question.setQuestionOrder(dto.getQuestionOrder());
        question.setPoints(dto.getPoints());
        question.setCreatedAt(LocalDateTime.now());
        question.setQuiz(quiz);

        if (dto.getAnswers() != null) {
            List<Answer> answers = dto.getAnswers().stream()
                .map(answerDto -> {
                    Answer answer = new Answer();
                    answer.setAnswerText(answerDto.getAnswerText());
                    answer.setIsCorrect(answerDto.getIsCorrect());
                    answer.setChoiceOrder(answerDto.getChoiceOrder());
                    answer.setQuestion(question);
                    return answer;
                })
                .collect(Collectors.toList());
            question.setAnswers(answers);
        }

        return question;
    }
}