package com.quizai.quizapp.service;

import com.quizai.quizapp.dto.GeneratedQuizDto;
import com.quizai.quizapp.dto.GeneratedQuizDto.GeneratedQuizResponse;
import com.quizai.quizapp.dto.QuizDto;
import com.quizai.quizapp.model.Answer;
import com.quizai.quizapp.model.Question;
import com.quizai.quizapp.model.Quiz;
import com.quizai.quizapp.model.User;
import com.quizai.quizapp.repository.QuizRepository;
import com.quizai.quizapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
public class QuizService {

    private static final Logger logger = LoggerFactory.getLogger(QuizService.class);

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DeepSeekService deepSeekService;

    public List<QuizDto> getAllQuizzes() {
        return quizRepository.findAll().stream()
                .map(QuizDto::new)
                .collect(Collectors.toList());
    }
     public List<Quiz> getAllQuizzes2() {
        return quizRepository.findAll();
    }

    public Optional<QuizDto> getQuizById(Long id) {
        return quizRepository.findById(id).map(QuizDto::new);
    }

    public List<QuizDto> getQuizzesByCreator(Long creatorId) {
        return quizRepository.findByCreatorId(creatorId).stream()
                .map(QuizDto::new)
                .collect(Collectors.toList());
    }

    public List<QuizDto> getQuizzesBySubject(String subject) {
        return quizRepository.findBySubjectContainingIgnoreCase(subject).stream()
                .map(QuizDto::new)
                .collect(Collectors.toList());
    }

    public List<QuizDto> getQuizzesByDifficulty(Quiz.Difficulty difficulty) {
        return quizRepository.findByDifficulty(difficulty).stream()
                .map(QuizDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public QuizDto createQuiz(Quiz quiz, Long creatorId) {
        try {
            User creator = userRepository.findById(creatorId)
                    .orElseThrow(() -> new RuntimeException("Créateur non trouvé"));

            quiz.setCreator(creator);
            quiz.setCreatedAt(LocalDateTime.now());
            quiz.setIsAIGenerated(false);

            Quiz savedQuiz = quizRepository.save(quiz);

            QuizDto responseDto = new QuizDto();
            responseDto.setId(savedQuiz.getId());
            responseDto.setTitle(savedQuiz.getTitle());
            responseDto.setSubject(savedQuiz.getSubject());
            responseDto.setNiveau(savedQuiz.getNiveau());
            responseDto.setTimeLimit(savedQuiz.getTimeLimit());
            responseDto.setCreatedAt(savedQuiz.getCreatedAt());
            responseDto.setUpdatedAt(savedQuiz.getUpdatedAt());

            if (savedQuiz.getDifficulty() != null) {
                responseDto.setDifficulty(savedQuiz.getDifficulty().name());
            } else {
                responseDto.setDifficulty("EASY");
            }

            responseDto.setIsAIGenerated(savedQuiz.getIsAIGenerated() != null ? savedQuiz.getIsAIGenerated() : false);
            return responseDto;

        } catch (Exception e) {
            logger.error("Erreur dans createQuiz: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la création du quiz", e);
        }
    }

    @Transactional
    public QuizDto updateQuiz(Long id, Quiz quizDetails) {
        try {
            logger.info("Données reçues pour updateQuiz: {}", quizDetails);

            Quiz quiz = quizRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Quiz introuvable avec ID: " + id));

            logger.info("État actuel du quiz avant mise à jour: {}", quiz);

            quiz.setTitle(quizDetails.getTitle());
            quiz.setSubject(quizDetails.getSubject());
            quiz.setDifficulty(quizDetails.getDifficulty());
            quiz.setTimeLimit(quizDetails.getTimeLimit());
            quiz.setNiveau(quizDetails.getNiveau());
            quiz.setUpdatedAt(LocalDateTime.now());

            logger.info("État du quiz avant save: {}", quiz);

            Quiz updatedQuiz = quizRepository.save(quiz);

            logger.info("Quiz sauvegardé avec succès: {}", updatedQuiz);

            QuizDto responseDto = new QuizDto(updatedQuiz);
            return responseDto;

        } catch (Exception e) {
            logger.error("Erreur dans updateQuiz: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la mise à jour du quiz", e);
        }
    }

    @Transactional
    public void deleteQuiz(Long id) {
        try {
            if (!quizRepository.existsById(id)) {
                throw new RuntimeException("Quiz introuvable avec l'ID: " + id);
            }
            quizRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la suppression du quiz", e);
        }
    }

    /**
     * Génération automatique du quiz avec DeepSeek + sauvegarde
     */
    @Transactional
    public Mono<QuizDto> generateAndSaveQuiz(GeneratedQuizDto request, Long creatorId) {
        logger.info("Début de la génération de quiz pour le créateur {}", creatorId);
        
        // Validation des paramètres d'entrée
        if (request == null) {
            return Mono.error(new IllegalArgumentException("La requête ne peut pas être nulle"));
        }
        
        if (creatorId == null) {
            return Mono.error(new IllegalArgumentException("L'ID du créateur ne peut pas être nul"));
        }

        if (!userRepository.existsById(creatorId)) {
            return Mono.error(new RuntimeException("Créateur introuvable avec l'ID: " + creatorId));
        }

        List<String> questionTypes = request.getQuestionTypes() != null && !request.getQuestionTypes().isEmpty() 
            ? request.getQuestionTypes() 
            : List.of("single_choice");
        
        logger.info("Types de questions demandés: {}", questionTypes);
        
        return deepSeekService.generateQuizFromPrompt(
                request.getSubject(),
                request.getNumberOfQuestions(),
                request.getDifficulty(),
                request.getInstructions(),
                request.getNiveau(),
                request.getTopic(),
                questionTypes 
        )
        .flatMap(generatedResponse -> {
            try {
                logger.info("Réponse reçue de DeepSeek, conversion en entité...");
                return convertAndSaveQuiz(generatedResponse, request, creatorId);
            } catch (Exception e) {
                logger.error("Erreur lors de la conversion/sauvegarde: {}", e.getMessage(), e);
                return Mono.error(new RuntimeException("Erreur lors de la sauvegarde du quiz généré: " + e.getMessage()));
            }
        })
        .doOnSuccess(quiz -> logger.info("Quiz généré et sauvegardé avec succès, ID: {}", quiz.getId()))
        .doOnError(error -> logger.error("Erreur lors de la génération et sauvegarde: {}", error.getMessage(), error))
        .onErrorMap(this::mapGenerationError);
    }

    private Mono<QuizDto> convertAndSaveQuiz(GeneratedQuizResponse response, GeneratedQuizDto request, Long creatorId) {
        return Mono.fromCallable(() -> {
           
            
            User creator = userRepository.findById(creatorId)
                    .orElseThrow(() -> new RuntimeException("Créateur non trouvé avec l'ID: " + creatorId));

            Quiz quiz = buildQuizFromResponse(response, request, creator);
            Quiz savedQuiz = quizRepository.save(quiz);
        
            return buildQuizDto(savedQuiz);
        });
    }

    private Quiz buildQuizFromResponse(GeneratedQuizResponse response, GeneratedQuizDto request, User creator) {
        Quiz quiz = new Quiz();
        quiz.setTitle(response.getTitle() != null ? response.getTitle() : "Quiz généré par IA");
        quiz.setSubject(request.getSubject());
 
        try {
            quiz.setDifficulty(Quiz.Difficulty.valueOf(request.getDifficulty().toUpperCase()));
        } catch (IllegalArgumentException e) {
            logger.warn("Difficulté invalide: {}, utilisation de MEDIUM par défaut", request.getDifficulty());
            quiz.setDifficulty(Quiz.Difficulty.MEDIUM);
        }
        
        quiz.setTimeLimit(request.getNumberOfQuestions() * 2); 
        quiz.setCreator(creator);
        quiz.setNiveau(request.getNiveau());
        quiz.setIsAIGenerated(true);
        quiz.setCreatedAt(LocalDateTime.now());

        //
        if (response.getQuestions() != null && !response.getQuestions().isEmpty()) {
            logger.info("Conversion de {} questions...", response.getQuestions().size());
            
            List<Question> questions = response.getQuestions().stream()
                    .map(gq -> buildQuestionFromGenerated(gq, quiz))
                    .collect(Collectors.toList());

            quiz.setQuestions(questions);
            logger.info("Conversion terminée: {} questions avec leurs réponses", questions.size());
        } else {
            logger.warn("Aucune question trouvée dans la réponse");
            quiz.setQuestions(new ArrayList<>());
        }

        return quiz;
    }

    private Question buildQuestionFromGenerated(GeneratedQuizDto.GeneratedQuestion gq, Quiz quiz) {
        Question question = new Question();
        question.setQuiz(quiz);
        question.setQuestionText(gq.getQuestion());
        question.setExplanation(gq.getExplanation());
        question.setCreatedAt(LocalDateTime.now());

        List<Integer> correctAnswers = determineCorrectAnswers(gq);
        
   
        List<Answer> answers = new ArrayList<>();
        for (int i = 0; i < gq.getOptions().size(); i++) {
            Answer answer = new Answer();
            answer.setAnswerText(gq.getOptions().get(i));
            answer.setIsCorrect(correctAnswers.contains(i));
            answer.setCreatedAt(LocalDateTime.now());
            answer.setQuestion(question);
            answers.add(answer);
        }

        question.setAnswers(answers);
        return question;
    }

    private List<Integer> determineCorrectAnswers(GeneratedQuizDto.GeneratedQuestion gq) {
        List<Integer> correctAnswers = new ArrayList<>();
        
        String type = gq.getType() != null ? gq.getType().toLowerCase() : "single_choice";
        
        switch (type) {
            case "multiple_choice":
                if (gq.getCorrectAnswers() != null && !gq.getCorrectAnswers().isEmpty()) {
                    correctAnswers.addAll(gq.getCorrectAnswers());
                } else if (gq.getCorrectAnswer() != null) {
                    correctAnswers.add(gq.getCorrectAnswer());
                } else {
                    logger.warn("Aucune réponse correcte trouvée pour question à choix multiples, utilisation de la première option");
                    correctAnswers.add(0);
                }
                break;
                
            case "single_choice":
            case "true_false":
            default:
                if (gq.getCorrectAnswer() != null) {
                    correctAnswers.add(gq.getCorrectAnswer());
                } else if (gq.getCorrectAnswers() != null && !gq.getCorrectAnswers().isEmpty()) {
                    correctAnswers.add(gq.getCorrectAnswers().get(0)); 
                } else {
                    logger.warn("Aucune réponse correcte trouvée pour question à choix unique, utilisation de la première option");
                    correctAnswers.add(0);
                }
                break;
        }
        
        return correctAnswers;
    }

    private QuizDto buildQuizDto(Quiz savedQuiz) {
        QuizDto responseDto = new QuizDto();
        responseDto.setId(savedQuiz.getId());
        responseDto.setTitle(savedQuiz.getTitle());
        responseDto.setSubject(savedQuiz.getSubject());
        responseDto.setNiveau(savedQuiz.getNiveau());
        responseDto.setTimeLimit(savedQuiz.getTimeLimit());
        responseDto.setCreatedAt(savedQuiz.getCreatedAt());
        responseDto.setUpdatedAt(savedQuiz.getUpdatedAt());

        if (savedQuiz.getDifficulty() != null) {
            responseDto.setDifficulty(savedQuiz.getDifficulty().name());
        } else {
            responseDto.setDifficulty("MEDIUM");
        }

        responseDto.setIsAIGenerated(true);
        responseDto.setQuestionCount(savedQuiz.getQuestions() != null ? savedQuiz.getQuestions().size() : 0);

        if (savedQuiz.getCreator() != null) {
            responseDto.setCreatorId(savedQuiz.getCreator().getId());
            responseDto.setCreatorName(savedQuiz.getCreator().getName());
        }

        logger.info("DTO de réponse créé avec succès");
        return responseDto;
    }

    private Throwable mapGenerationError(Throwable error) {
        String message = error.getMessage();
        
        if (error instanceof IllegalArgumentException) {
            return new RuntimeException("Paramètres invalides: " + message);
        }
        
        if (message != null) {
            if (message.contains("API") || message.contains("DeepSeek")) {
                return new RuntimeException("Erreur de service IA: " + message);
            } else if (message.contains("JSON") || message.contains("format")) {
                return new RuntimeException("Erreur de format de réponse de l'IA. Veuillez réessayer.");
            } else if (message.contains("connexion") || message.contains("timeout")) {
                return new RuntimeException("Problème de connexion avec le service IA. Veuillez réessayer.");
            } else if (message.contains("Créateur")) {
                return new RuntimeException("Utilisateur introuvable. Veuillez vous reconnecter.");
            }
        }
        
        return new RuntimeException("Erreur lors de la génération du quiz: " + 
                                   (message != null ? message : "Erreur inconnue"));
    }
}