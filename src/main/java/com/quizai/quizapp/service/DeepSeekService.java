package com.quizai.quizapp.service;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizai.quizapp.dto.GeneratedQuizDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;
import java.time.Duration;
import java.util.Map;
import java.util.List;

@Service
public class DeepSeekService {

    private static final Logger logger = LoggerFactory.getLogger(DeepSeekService.class);
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${deepseek.api.key}")
    private String apiKey;

    @Value("${deepseek.api.url:https://api.deepseek.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${deepseek.api.timeout:30}")
    private int timeoutSeconds;

    public DeepSeekService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
        this.objectMapper = objectMapper;
    }
    public Mono<GeneratedQuizDto.GeneratedQuizResponse> generateQuizFromPrompt(
            String subject, int numberOfQuestions, String difficulty, 
            String instructions, String niveau, String topic, List<String> questionTypes) {
        
        logger.info("Génération de quiz - Sujet: {}, Questions: {}, Difficulté: {}, Niveau: {}, Types: {}", 
                   subject, numberOfQuestions, difficulty, niveau, questionTypes);

        String prompt = buildQuizPrompt(subject, numberOfQuestions, difficulty, instructions, niveau, topic, questionTypes);

        Map<String, Object> requestBody = Map.of(
            "model", "deepseek-chat",
            "messages", List.of(
                Map.of("role", "system", "content", "Tu es un expert en éducation qui génère des quiz de haute qualité avec différents types de questions : choix unique, choix multiples, et vrai/faux. Réponds uniquement en JSON valide."),
                Map.of("role", "user", "content", prompt)
            ),
            "temperature", 0.7,
            "max_tokens", 4000,
            "response_format", Map.of("type", "json_object")
        );
        return webClient.post()
                .uri(apiUrl)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(HttpStatusCode::isError, this::handleErrorResponse)
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(1))
                        .filter(throwable -> throwable instanceof WebClientResponseException.TooManyRequests))
                .flatMap(this::parseQuizResponse)
                .doOnSuccess(response -> logger.info("Quiz généré avec succès: {} questions", 
                            response.getQuestions() != null ? response.getQuestions().size() : 0))
                .doOnError(error -> logger.error("Erreur lors de la génération du quiz: {}", error.getMessage()));
    }
    private String buildQuizPrompt(String subject, int numberOfQuestions, String difficulty, 
                                 String instructions, String niveau, String topic, List<String> questionTypes) {
        
        String difficultyText = mapDifficultyToFrench(difficulty);
        String additionalInstructions = instructions != null && !instructions.trim().isEmpty() 
            ? "\n\nInstructions supplémentaires : " + instructions
            : "";

        String typeDistribution = buildTypeDistribution(questionTypes, numberOfQuestions);
        return String.format("""
            Génère un quiz de %d questions sur le sujet : "%s"
            Thème spécifique : "%s"
            Niveau scolaire : %s
            Niveau de difficulté : %s%s

            Types de questions à générer : %s

            Format de réponse STRICTEMENT en JSON :
            {
              "title": "Titre du quiz adapté au sujet et niveau",
              "questions": [
                {
                  "question": "Question à choix unique ?",
                  "type": "single_choice",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correct_answer": 2,
                  "explanation": "Explication détaillée"
                },
                {
                  "question": "Question à choix multiples (plusieurs bonnes réponses) ?",
                  "type": "multiple_choice",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correct_answers": [0, 2],
                  "explanation": "Explication des bonnes réponses"
                },
                {
                  "question": "Affirmation vrai ou faux",
                  "type": "true_false",
                  "options": ["Vrai", "Faux"],
                  "correct_answer": 0,
                  "explanation": "Explication vrai/faux"
                }
              ]
            }

            Règles OBLIGATOIRES :
            - Questions adaptées au niveau scolaire "%s"
            - Chaque question DOIT avoir un champ "type" : "single_choice", "multiple_choice", ou "true_false"
            
            POUR single_choice (choix unique) :
            - Exactement 4 options (A, B, C, D)
            - Un seul "correct_answer" (index 0-3)
            
            POUR multiple_choice (choix multiples) :
            - Exactement 4 options (A, B, C, D) 
            - "correct_answers" : [liste des index corrects] (ex: [0, 2])
            - Au moins 2 réponses correctes
            
            POUR true_false (vrai/faux) :
            - Exactement 2 options ["Vrai", "Faux"]
            - "correct_answer" : 0 ou 1
            
            - Questions claires et sans ambiguïté
            - Explications pédagogiques détaillées
            - Difficulté %s adaptée au niveau
            - Mélange équilibré des types sélectionnés
            - Réponse UNIQUEMENT en JSON valide, aucun texte avant ou après
            """, numberOfQuestions, subject, topic, niveau, difficultyText, 
                additionalInstructions, typeDistribution, niveau, difficultyText);
    }

    private String buildTypeDistribution(List<String> questionTypes, int totalQuestions) {
        if (questionTypes == null || questionTypes.isEmpty()) {
            return "Choix unique uniquement";
        }
        StringBuilder distribution = new StringBuilder();
        int typesCount = questionTypes.size();
        
        if (typesCount == 1) {
            String type = questionTypes.get(0);
            switch (type) {
                case "single_choice":
                    distribution.append("Questions à choix unique uniquement");
                    break;
                case "multiple_choice":
                    distribution.append("Questions à choix multiples uniquement");
                    break;
                case "true_false":
                    distribution.append("Questions vrai/faux uniquement");
                    break;
                default:
                    distribution.append("Questions à choix unique par défaut");
            }
        } else {
            int questionsPerType = totalQuestions / typesCount;
            int remainder = totalQuestions % typesCount;
            
            distribution.append("Répartition approximative : ");
            for (int i = 0; i < questionTypes.size(); i++) {
                String type = questionTypes.get(i);
                int count = questionsPerType + (i < remainder ? 1 : 0);
                
                String typeName = switch (type) {
                    case "single_choice" -> "choix unique";
                    case "multiple_choice" -> "choix multiples";
                    case "true_false" -> "vrai/faux";
                    default -> "choix unique";
                };
                
                distribution.append(count).append(" ").append(typeName);
                if (i < questionTypes.size() - 1) {
                    distribution.append(", ");
                }
            }
        }
        return distribution.toString();
    }
    private String mapDifficultyToFrench(String difficulty) {
        return switch (difficulty.toLowerCase()) {
            case "easy" -> "Facile";
            case "medium" -> "Moyen";
            case "hard" -> "Difficile";
            default -> "Moyen";
        };
    }
    private Mono<Throwable> handleErrorResponse(ClientResponse response) {
        return response.bodyToMono(String.class)
                .flatMap(body -> {
                    logger.error("Erreur API DeepSeek - Status: {}, Body: {}", response.statusCode(), body);
                    String errorMessage = switch (response.statusCode().value()) {
                        case 401 -> "Clé API invalide ou manquante";
                        case 429 -> "Limite de taux dépassée, veuillez réessayer plus tard";
                        case 500 -> "Erreur interne du service DeepSeek";
                        case 503 -> "Service DeepSeek temporairement indisponible";
                        default -> "Erreur de l'API DeepSeek: " + response.statusCode();
                    };
                    return Mono.error(new RuntimeException(errorMessage + " - " + body));
                });
    }
    private Mono<GeneratedQuizDto.GeneratedQuizResponse> parseQuizResponse(String response) {
        try {
            logger.debug("Réponse brute de DeepSeek: {}", response);

            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode contentNode = rootNode
                    .path("choices")
                    .path(0)
                    .path("message")
                    .path("content");
            if (contentNode.isMissingNode()) {
                return Mono.error(new RuntimeException("Pas de contenu dans la réponse DeepSeek"));
            }
            String content = contentNode.asText();
            logger.debug("Contenu extrait: {}", content);

            JsonNode quizNode = objectMapper.readTree(content);
            GeneratedQuizDto.GeneratedQuizResponse quizResponse = 
                    objectMapper.treeToValue(quizNode, GeneratedQuizDto.GeneratedQuizResponse.class);

            validateQuizResponse(quizResponse);
            return Mono.just(quizResponse);

        } catch (JsonProcessingException e) {
            logger.error("Erreur lors du parsing JSON: {}", e.getMessage());
            return Mono.error(new RuntimeException("Erreur lors du parsing de la réponse: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur inattendue lors du parsing: {}", e.getMessage());
            return Mono.error(new RuntimeException("Erreur lors du traitement de la réponse: " + e.getMessage()));
        }
    }
    private void validateQuizResponse(GeneratedQuizDto.GeneratedQuizResponse response) {
        if (response == null) {
            throw new IllegalArgumentException("Réponse de quiz nulle");
        }
        if (response.getQuestions() == null || response.getQuestions().isEmpty()) {
            throw new IllegalArgumentException("Aucune question générée");
        }
        for (int i = 0; i < response.getQuestions().size(); i++) {
            GeneratedQuizDto.GeneratedQuestion question = response.getQuestions().get(i);
            
            if (question.getQuestion() == null || question.getQuestion().trim().isEmpty()) {
                throw new IllegalArgumentException("Question " + (i + 1) + " vide");
            }

            if (question.getOptions() == null || question.getOptions().isEmpty()) {
                throw new IllegalArgumentException("Question " + (i + 1) + " sans options");
            }
            String questionType = question.getType() != null ? question.getType().toLowerCase() : "single_choice";
            
            switch (questionType) {
                case "true_false":
                    if (question.getOptions().size() != 2) {
                        throw new IllegalArgumentException("Question vrai/faux " + (i + 1) + " doit avoir exactement 2 options");
                    }
                    break;
                    
                case "single_choice":
                case "multiple_choice":
                    if (question.getOptions().size() != 4) {
                        throw new IllegalArgumentException("Question " + questionType + " " + (i + 1) + " doit avoir exactement 4 options");
                    }
                    break;
                    
                default:
                    throw new IllegalArgumentException("Type de question non reconnu: " + questionType);
            }
            if (!question.isValidCorrectAnswer()) {
                throw new IllegalArgumentException("Réponse(s) correcte(s) invalide(s) pour la question " + (i + 1) + " de type " + questionType);
            }
            
            for (int j = 0; j < question.getOptions().size(); j++) {
                if (question.getOptions().get(j) == null || question.getOptions().get(j).trim().isEmpty()) {
                    throw new IllegalArgumentException("Option " + (j + 1) + " vide pour la question " + (i + 1));
                }
            }
        }
    }
    public Mono<GeneratedQuizDto.GeneratedQuizResponse> generateQuizFromPrompt(
            String subject, int numberOfQuestions, String difficulty, 
            String instructions, String niveau, String topic) {
        return generateQuizFromPrompt(subject, numberOfQuestions, difficulty, 
                                    instructions, niveau, topic, List.of("single_choice"));
    }
    public Mono<Boolean> testConnection() {
        Map<String, Object> testRequest = Map.of(
            "model", "deepseek-chat",
            "messages", List.of(
                Map.of("role", "user", "content", "Test de connexion")
            ),
            "max_tokens", 10
        );
        return webClient.post()
                .uri(apiUrl)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(testRequest)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(10))
                .map(response -> true)
                .onErrorReturn(false);
    }
}