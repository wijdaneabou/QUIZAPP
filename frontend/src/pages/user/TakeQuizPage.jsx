import { useState, useEffect } from 'react';
import { Clock, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Award, Eye } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import resultsService from '../../services/resultsService';

const TakeQuizPage = ({ onNavigateBack }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const quizId = id;

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [results, setResults] = useState(null);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ============== FONCTIONS UTILITAIRES POUR DÉTECTION CHOIX MULTIPLES ==============
  
  const isMultipleChoiceQuestion = (question) => {
    return question.type === 'MULTIPLE_CHOICE' || 
           question.type === 'MULTIPLE' ||
           question.isMultipleChoice === true ||
           question.allowMultiple === true ||
           question.multipleChoice === true ||
           (question.correctAnswers && Array.isArray(question.correctAnswers) && question.correctAnswers.length > 1);
  };

  const detectMultipleCorrectAnswers = (question) => {
    // Si vous avez les réponses correctes dans vos données
    if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
      return question.correctAnswers.length > 1;
    }
    
    // Si vous avez les réponses avec un flag correct
    if (question.options && Array.isArray(question.options)) {
      const correctCount = question.options.filter(option => 
        option.isCorrect || option.correct
      ).length;
      return correctCount > 1;
    }
    
    return false;
  };

  const forceMultipleChoiceForSpecificQuestions = (question) => {
    const multipleChoiceKeywords = [
      'sélectionnez les',
      'choisissez les',
      'quels sont',
      'lesquels',
      'cochez toutes',
      'marquez toutes',
      'tous les suivants',
      'plusieurs réponses',
      'métaux de la liste', // Spécifique à votre exemple
      'sélectionnez tous',
      'choisissez tous'
    ];
    
    const questionText = question.questionText?.toLowerCase() || '';
    
    return multipleChoiceKeywords.some(keyword => 
      questionText.includes(keyword)
    );
  };

  const getQuestionType = (question) => {
    // 1. Vérification explicite du type
    if (question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTIPLE') {
      return 'multiple';
    }
    
    // 2. Vérification des propriétés booléennes
    if (question.isMultipleChoice || question.allowMultiple) {
      return 'multiple';
    }
    
    // 3. Vérification basée sur les réponses correctes
    if (detectMultipleCorrectAnswers(question)) {
      return 'multiple';
    }
    
    // 4. Vérification basée sur le texte de la question
    if (forceMultipleChoiceForSpecificQuestions(question)) {
      return 'multiple';
    }
    
    // 5. Par défaut, choix unique
    return 'single';
  };

  // Fonction de debug (optionnelle)
  const debugQuestionType = (question) => {
    console.log('Question Debug:', {
      id: question.id,
      text: question.questionText,
      type: question.type,
      isMultipleChoice: question.isMultipleChoice,
      allowMultiple: question.allowMultiple,
      correctAnswers: question.correctAnswers,
      detectedType: getQuestionType(question),
      options: question.options
    });
  };

  // ============== FONCTIONS UTILITAIRES EXISTANTES ==============

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
 
  // Utilisateur 
  useEffect(() => {
    const initializeUser = () => {
      try {
        const userId = resultsService.getCurrentUserId();
        setCurrentUserId(userId);
      } catch (error) {
        console.error('Erreur initialisation utilisateur:', error);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    const debugQuizzes = async () => {
      try {
        const allQuizzes = await quizService.getAllQuizzes();
        setAvailableQuizzes(allQuizzes);
      } catch (error) {
        console.error(' Impossible de récupérer les quiz disponibles:', error);
      }
    };
    
    debugQuizzes();
  }, []);

  // Timer
  useEffect(() => {
    let timer;
    if (quizStarted && !results && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, results, timeLeft]);

  // Chargement du quiz
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!quizId) {
          throw new Error('ID du quiz manquant');
        }
        
        const [quizData, questionsData] = await Promise.all([
          quizService.getQuizById(quizId),
          quizService.quizTaking.getQuestionsByQuizId(quizId)
        ]);

        if (!quizData) {
          throw new Error('Quiz non trouvé');
        }
        
        if (!questionsData || questionsData.length === 0) {
          throw new Error('Aucune question trouvée pour ce quiz');
        }
        
        setQuiz(quizData);
        setQuestions(questionsData);
        setTimeLeft((quizData.timeLimit || 10) * 60);
        
      } catch (err) {
        console.error('Erreur chargement quiz:', err);
        setError(err.message || 'Erreur lors du chargement du quiz');
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      loadQuiz();
    } else {
      setLoading(false);
      setError('ID du quiz manquant dans l\'URL');
    }
  }, [quizId]);

  // ============== FONCTIONS DE GESTION DES RÉPONSES AMÉLIORÉES ==============

  // Fonction pour gérer la sélection des réponses (simple ou multiple)
  const handleAnswerSelect = (questionId, selectedAnswer, isMultipleChoice = false) => {
    setAnswers(prev => {
      if (isMultipleChoice) {
        // Pour les questions à choix multiples
        const currentAnswers = prev[questionId] || [];
        const updatedAnswers = currentAnswers.includes(selectedAnswer)
          ? currentAnswers.filter(answer => answer !== selectedAnswer)
          : [...currentAnswers, selectedAnswer];
        
        return {
          ...prev,
          [questionId]: updatedAnswers
        };
      } else {
        // Pour les questions à choix unique
        return {
          ...prev,
          [questionId]: selectedAnswer
        };
      }
    });
  };

  // Fonction pour vérifier si une réponse est sélectionnée
  const isAnswerSelected = (questionId, answer, isMultipleChoice = false) => {
    if (isMultipleChoice) {
      const selectedAnswers = answers[questionId] || [];
      return selectedAnswers.includes(answer);
    } else {
      return answers[questionId] === answer;
    }
  };

  // Fonction pour vérifier si la question actuelle a une réponse
  const hasAnswer = (questionId, isMultipleChoice = false) => {
    if (isMultipleChoice) {
      const selectedAnswers = answers[questionId] || [];
      return selectedAnswers.length > 0;
    } else {
      return answers[questionId] !== undefined;
    }
  };

  // ============== FONCTIONS DE NAVIGATION ==============

  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const handleSubmitQuiz = async () => {
    try {
      setLoading(true);
      
      const timeSpent = (quiz?.timeLimit || 10) * 60 - timeLeft;
         
      const finalResult = await resultsService.submitQuizResult(
        quizId, 
        answers, 
        timeSpent,
        questions
      );
      setResults(finalResult);
      
    } catch (error) {
      setResults({
        score: 0,
        correctAnswers: 0,
        totalQuestions: questions.length,
        timeSpent: (quiz?.timeLimit || 10) * 60 - timeLeft,
        percentage: 0,
        submittedAt: new Date().toISOString(),
        _isError: true,
        _errorMessage: error.message || "Erreur lors du calcul du résultat",
        _isLocal: true,
        _isSaved: false
      });
      
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (results && results.resultId) {
      navigate(`/quiz/details/${results.resultId}`, { 
        state: { 
          autoOpenResultId: results.resultId,
          resultData: results
        } 
      });
    } else {
      console.warn('Aucun ID de résultat disponible pour la navigation');
      navigate('/results');
    }
  };

  const handleReturnHome = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      navigate('/');
    }
  };

  const handleRetryQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft((quiz?.timeLimit || 10) * 60);
    setQuizStarted(false);
    setResults(null);
    setError(null);
  };
  
  // ============== ÉCRANS DE CHARGEMENT ET D'ERREUR ==============
  
  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  // Écran d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-4">Erreur de Chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          {availableQuizzes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Quiz disponibles :</h3>
              <div className="space-y-2 text-sm">
                {availableQuizzes.slice(0, 3).map(quiz => (
                  <div key={quiz.id} className="p-2 bg-gray-50 rounded">
                    <strong>ID {quiz.id}:</strong> {quiz.title}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
            
            {availableQuizzes.length > 0 && (
              <button
                onClick={() => navigate(`/quiz/${availableQuizzes[0].id}`)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Essayer le Quiz "{availableQuizzes[0].title}"
              </button>
            )}
            
            <button
              onClick={handleReturnHome}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retour à l'Accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============== ÉCRAN DES RÉSULTATS ==============
  
  // Écran des résultats
  if (results) {
    const getScoreColor = (score) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getScoreMessage = (score) => {
      if (score >= 80) return 'Excellent travail !';
      if (score >= 60) return 'Bien joué !';
      return 'Continuez à vous entraîner !';
    };

    const finalScore = results.score || results.percentage || 0;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Award className="w-20 h-20 mx-auto mb-4 text-green-600" />
            <h1 className="text-3xl font-bold mb-2">Quiz Terminé </h1>
            <p className="text-gray-600 mb-6">{getScoreMessage(finalScore)}</p>
            
            <div className={`text-4xl font-bold mb-6 ${getScoreColor(finalScore)}`}>
              {Math.round(finalScore)}%
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {results.correctAnswers || 0}
                </div>
                <div className="text-sm text-gray-600">Correctes</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {(results.totalQuestions || questions.length) - (results.correctAnswers || 0)}
                </div>
                <div className="text-sm text-gray-600">Incorrectes</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime(results.timeSpent || 0)}
                </div>
                <div className="text-sm text-gray-600">Temps</div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRetryQuiz}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Recommencer ce Quiz
              </button>
              
              <button
                onClick={handleReturnHome}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Retour à l'Accueil
              </button>
              {results.resultId && !results._isError && (
                <button
                  onClick={handleViewDetails}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Voir les détails des réponses
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============== ÉCRAN D'ACCUEIL DU QUIZ ==============
  
  // Écran d'accueil du quiz
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="text-white p-8 relative overflow-hidden" style={{background: 'linear-gradient(to bottom right, #070C9C, #0B13F4, #272EF5)'}}>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
    
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-sm">{quiz?.title}</h1>
                <p className="text-white/90 text-lg font-medium drop-shadow-sm">{quiz?.subject}</p>
                {quiz?.description && (
                  <p className="text-white/80 mt-4 drop-shadow-sm">{quiz.description}</p>
                )}
              </div>
         
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{questions.length}</div>
                  <div className="text-gray-600">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{quiz?.timeLimit} min</div>
                  <div className="text-gray-600">Durée</div>
                </div>
              </div>
              
              {quiz?.difficulty && (
                <div className="mb-6 text-center">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    quiz.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                    quiz.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Difficulté: {quiz.difficulty}
                  </span>
                </div>
              )}
              
              <button
                onClick={startQuiz}
                className="w-full text-white py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                style={{background: 'linear-gradient(to right, #070C9C, #0B13F4)', ':hover': {background: 'linear-gradient(to right, #070C9C,#0B13F4)'}}}
                onMouseEnter={(e) => e.target.style.background = 'linear-gradient(to right, #070C9C, #0B13F4)'}
                onMouseLeave={(e) => e.target.style.background = 'linear-gradient(to right, #070C9C, #0B13F4)'}
              >
                Commencer le Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============== INTERFACE PRINCIPALE DU QUIZ ==============
  
  // Interface principale du quiz
  const currentQ = questions[currentQuestion];
  
  if (!currentQ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Question non trouvée</h2>
          <p className="text-gray-600 mb-4">Impossible d'afficher la question {currentQuestion + 1}</p>
          <button
            onClick={() => setCurrentQuestion(0)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au début
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;
  
  // Calculer le nombre de questions répondues
  const answeredCount = questions.filter(question => {
    const questionType = getQuestionType(question);
    const isMultiple = questionType === 'multiple';
    return hasAnswer(question.id, isMultiple);
  }).length;

  // ============== DÉTECTION AMÉLIORÉE DU TYPE DE QUESTION ==============
  
  // Déterminer si la question actuelle est à choix multiples
  const isCurrentQuestionMultiple = getQuestionType(currentQ) === 'multiple';
  
  // Debug: afficher le type de question détecté (optionnel)
  // console.log('Question actuelle:', currentQ.questionText);
  // console.log('Type détecté:', isCurrentQuestionMultiple ? 'Multiple' : 'Simple');
  // debugQuestionType(currentQ);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{quiz?.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} sur {questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                <Clock className="inline w-5 h-5 mr-2" />
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-gray-500">Temps restant</div>
            </div>
          </div>
                    
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 leading-relaxed">
              {currentQ.questionText}
            </h2>
            
          </div>

          {/* Options de réponse */}
          <div className="space-y-4 mb-8">
            {currentQ.options?.map((option, index) => {
              const isSelected = isAnswerSelected(currentQ.id, option, isCurrentQuestionMultiple);
              
              return (
                <label
                  key={index}
                  className={`block p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type={isCurrentQuestionMultiple ? "checkbox" : "radio"}
                      name={isCurrentQuestionMultiple ? undefined : `question-${currentQ.id}`}
                      value={option}
                      checked={isSelected}
                      onChange={() => handleAnswerSelect(currentQ.id, option, isCurrentQuestionMultiple)}
                      className="w-5 h-5 text-blue-600 mr-4"
                    />
                    <span className="text-lg">{option}</span>
                  </div>
                </label>
              );
            })}
          </div>

  
          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={goToPreviousQuestion}
              disabled={currentQuestion === 0}
              className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Précédent
            </button>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">
                {answeredCount} sur {questions.length} répondues
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={goToNextQuestion}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentQuestion === questions.length - 1 ? 'Terminer' : 'Suivant'}
              {currentQuestion === questions.length - 1 ? 
                <CheckCircle className="w-5 h-5 ml-2" /> : 
                <ArrowRight className="w-5 h-5 ml-2" />
              }
            </button>
          </div>
          
          {/* Indicateurs de progression par question améliorés */}
          <div className="flex justify-center mt-6 space-x-1">
            {questions.map((question, index) => {
              const questionType = getQuestionType(question);
              const isMultiple = questionType === 'multiple';
              const questionHasAnswer = hasAnswer(question.id, isMultiple);
              
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentQuestion 
                      ? 'bg-blue-600' 
                      : questionHasAnswer
                        ? 'bg-green-400' 
                        : 'bg-gray-300'
                  } ${isMultiple ? 'ring-2 ring-blue-300' : ''}`}
                  title={`Question ${index + 1}${questionHasAnswer ? ' (répondue)' : ''}${isMultiple ? ' (choix multiples)' : ''}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeQuizPage;