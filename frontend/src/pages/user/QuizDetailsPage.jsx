import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {ArrowLeft, Clock, Target, CheckCircle, XCircle,AlertTriangle, TrendingUp, BarChart3, RefreshCw,GraduationCap, Award, Lightbulb, User, Trophy} from 'lucide-react';
import resultsService from '../../services/resultsService';
import { useAuth } from '../../auth/AuthContext';

const QuizDetailPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const loadResultDetail = useCallback(async () => {
    if (!resultId || isNaN(parseInt(resultId, 10)) || parseInt(resultId, 10) <= 0) {
      console.error('ID de résultat invalide:', resultId);
      setError('ID de résultat invalide ou manquant. Veuillez vérifier le lien.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await resultsService.getResultById(resultId);
      
      if (!data.answers || data.answers.length === 0) {
        console.warn("Le résultat ne contient pas de réponses détaillées.", data);
      }

      setResult(data);
      console.log(`Détail du résultat chargé:`, data);
      
    } catch (err) {
      console.error('Erreur lors du chargement du détail:', err);
      if (err.response?.status === 404) {
        setError('Résultat non trouvé. Il a peut-être été supprimé.');
      } else {
        setError(err.message || 'Impossible de charger les détails du résultat. Réessayez plus tard.');
      }
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  useEffect(() => {
    loadResultDetail();
  }, [loadResultDetail]);

  const handleBack = () => navigate('/results');

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return { message: "Excellent ! Performance exceptionnelle", color: "text-green-600", icon: Trophy };
    if (percentage >= 80) return { message: "Très bien ! Bonne maîtrise", color: "text-blue-600", icon: Award };
    if (percentage >= 70) return { message: "Bien ! Continue comme ça", color: "text-yellow-600", icon: Target };
    if (percentage >= 60) return { message: "Assez bien, mais peut mieux faire", color: "text-orange-600", icon: TrendingUp };
    return { message: "Il faut réviser davantage", color: "text-red-600", icon: AlertTriangle };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold">Chargement des détails...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-4">Erreur de Chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <button onClick={loadResultDetail} className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
            </button>
            <button onClick={handleBack} className="w-full flex items-center justify-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Aucun résultat à afficher.</p>
      </div>
    );
  }

  const performanceMsg = getPerformanceMessage(result.percentage);
  const PerformanceIcon = performanceMsg.icon;
  const correctAnswersCount = result.answers?.filter(a => a.isCorrect).length || result.score;
  const incorrectAnswersCount = (result.total || 0) - correctAnswersCount;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button onClick={handleBack} className="flex items-center text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5 mr-2" /> Retour aux résultats
            </button>
          </div>

          {/* Informations du résultat */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <BarChart3 className="w-6 h-6 mr-2" />
                    <span className="text-blue-100 font-medium">Résultat détaillé</span>
                  </div>
                  <p className="text-blue-100 text-lg">{result.subject}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold mb-1">{Math.round(result.percentage)}%</div>
                  <div className={`flex items-center ${performanceMsg.color}`}>
                    <PerformanceIcon className="w-4 h-4 mr-1" />
                    <span className="text-blue-100">{result.score}/{result.total}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Statistiques détaillées */}
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{correctAnswersCount}</div>
                  <div className="text-sm text-gray-600">Correctes</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-2">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">{incorrectAnswersCount}</div>
                  <div className="text-sm text-gray-600">Incorrectes</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{result.total}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{formatTime(result.timeSpent)}</div>
                  <div className="text-sm text-gray-600">Temps passé</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                    <GraduationCap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{Math.round(result.percentage)}%</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white rounded-lg border-l-4 border-blue-400">
                <div className="flex items-center">
                  <PerformanceIcon className={`w-6 h-6 mr-3 ${performanceMsg.color}`} />
                  <span className={`font-semibold ${performanceMsg.color}`}>{performanceMsg.message}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {result.answers && result.answers.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Analyse détaillée des réponses
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded mr-2"></div>
                    <span className="text-gray-600">Votre réponse</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-200 border border-green-400 rounded mr-2"></div>
                    <span className="text-gray-600">Réponse correcte</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAllQuestions(!showAllQuestions)} 
                  className="text-blue-600 font-medium hover:text-blue-700 transition"
                >
                  {showAllQuestions ? 'Vue par question' : 'Voir toutes'}
                </button>
              </div>
            </div>

            {showAllQuestions ? (
              <div className="p-6 space-y-6">
                {result.answers.map((answer, index) => (
                  <QuestionDetailComparison key={answer.questionId || index} answer={answer} index={index} />
                ))}
              </div>
            ) : (
              <div className="p-6">
                <QuestionDetailComparison answer={result.answers[currentQuestionIndex]} index={currentQuestionIndex} />
       
                {result.answers.length > 1 && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t">
                    <button 
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)} 
                      disabled={currentQuestionIndex === 0} 
                      className="flex items-center px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Précédent
                    </button>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">
                        Question {currentQuestionIndex + 1} sur {result.answers.length}
                      </span>
                      <div className="flex space-x-1">
                        {result.answers.map((answer, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`w-4 h-4 rounded-full transition ${
                              index === currentQuestionIndex 
                                ? 'bg-blue-600' 
                                : answer.isCorrect
                                  ? 'bg-green-400 hover:bg-green-500'
                                  : 'bg-red-400 hover:bg-red-500'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setCurrentQuestionIndex(prev => prev + 1)} 
                      disabled={currentQuestionIndex === result.answers.length - 1} 
                      className="flex items-center px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                    >
                      Suivant
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Aucun détail de réponse disponible</h3>
            <p className="text-gray-600 mt-2">Les réponses détaillées pour ce résultat n'ont pas pu être chargées.</p>
          </div>
        )}

        {/* Section des recommandations */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            Recommandations
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Points à améliorer :</h4>
              {result.percentage < 70 && (
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Revoir les concepts fondamentaux</li>
                  <li>• Pratiquer davantage d'exercices similaires</li>
                  <li>• Consulter les explications des réponses incorrectes</li>
                </ul>
              )}
              {result.percentage >= 70 && result.percentage < 85 && (
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Approfondir les sujets moins maîtrisés</li>
                  <li>• Réviser les réponses incorrectes</li>
                  <li>• Continuer la pratique régulière</li>
                </ul>
              )}
              {result.percentage >= 85 && (
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Excellent travail ! Continuez sur cette lancée</li>
                  <li>• Peut-être essayer des quiz plus difficiles</li>
                  <li>• Aider d'autres étudiants dans cette matière</li>
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Prochaines étapes :</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <button className="block w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                  Refaire ce quiz pour améliorer votre score
                </button>
                <button className="block w-full text-left p-3 bg-green-50 rounded-lg hover:bg-green-100 transition">
                  Essayer d'autres quiz sur {result.subject}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const QuestionDetailComparison = ({ answer, index, quizService }) => {
  if (!answer) return null;

  const { 
    isCorrect, 
    question, 
    selectedAnswer, 
    correctAnswer,
    correctAnswers = [],
    isMultipleChoice = false,
    explanation, 
    options,
    questionId
  } = answer;

  // Utiliser le service pour récupérer les réponses correctes si nécessaire
  const getCorrectAnswersFromService = (questionData) => {
    if (quizService && questionData) {
      // Utiliser la méthode du service results pour extraire les bonnes réponses
      return resultsService.findCorrectAnswers(questionData);
    }
    return [];
  };

  // Normalisation améliorée des réponses
  const normalizeAnswer = (ans) => {
    if (!ans) return [];
    if (Array.isArray(ans)) return ans.map(a => String(a).trim()).filter(a => a.length > 0);
    if (typeof ans === 'string') {
      // Gérer plusieurs types de séparateurs
      const separators = [',', ';', '|', '/', '\n', '\r\n'];
      for (const sep of separators) {
        if (ans.includes(sep)) {
          return ans.split(sep).map(s => String(s).trim()).filter(s => s.length > 0);
        }
      }
      return [String(ans).trim()].filter(a => a.length > 0);
    }
    return [];
  };
 
  const selectedAnswersArray = normalizeAnswer(selectedAnswer);
  let correctAnswersArray = [];
  
  // PRIORITÉ ABSOLUE : Utiliser le tableau correctAnswers s'il existe
  if (correctAnswers && Array.isArray(correctAnswers) && correctAnswers.length > 0) {
    correctAnswersArray = correctAnswers.map(a => String(a).trim()).filter(a => a.length > 0);
  } 
  // Fallback 1 : Utiliser le service pour extraire les réponses depuis les données de question
  else if (answer.answers && Array.isArray(answer.answers)) {
    correctAnswersArray = getCorrectAnswersFromService(answer);
  }
  // Fallback 2 : Utiliser correctAnswer comme chaîne
  else if (correctAnswer) {
    correctAnswersArray = normalizeAnswer(correctAnswer);
  }

  // Debug logging pour le développement
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Question ${index + 1} Debug:`, {
      questionId,
      questionText: question,
      selectedAnswersArray,
      correctAnswersArray,
      originalCorrectAnswers: correctAnswers,
      originalCorrectAnswer: correctAnswer,
      isMultipleChoiceProp: isMultipleChoice,
      isCorrectProp: isCorrect,
      hasAnswersData: answer.answers && answer.answers.length > 0,
      hasOptions: options && options.length > 0,
    });
  }

  // Auto-détection du type de question
  const isMultiChoice = isMultipleChoice || correctAnswersArray.length > 1;

  // Vérification de l'exactitude avec la logique du service
  const verifyAnswerCorrectness = () => {
    if (correctAnswersArray.length === 0) {
      console.warn(`Question ${index + 1}: Aucune réponse correcte définie`);
      return false;
    }
    return resultsService.isAnswerCorrect(selectedAnswer, correctAnswersArray, isMultiChoice);
  };

  // Utiliser la vérification du service si isCorrect semble incorrecte
  const isActuallyCorrect = isCorrect !== undefined ? isCorrect : verifyAnswerCorrectness();

  // Fonctions de vérification pour les options
  const isAnswerCorrectOption = (option) => {
    return correctAnswersArray.some(correct => 
      String(correct).toLowerCase().trim() === String(option).toLowerCase().trim()
    );
  };

  const isAnswerSelected = (option) => {
    return selectedAnswersArray.some(selected => 
      String(selected).toLowerCase().trim() === String(option).toLowerCase().trim()
    );
  };

  const getOptionStatus = (option) => {
    const isCorrectOption = isAnswerCorrectOption(option);
    const isSelectedOption = isAnswerSelected(option);

    if (isCorrectOption && isSelectedOption) {
      return { status: 'correct-selected', label: 'Votre réponse (correcte)' };
    } else if (isCorrectOption && !isSelectedOption) {
      return { status: 'correct-not-selected', label: 'Réponse correcte non sélectionnée' };
    } else if (!isCorrectOption && isSelectedOption) {
      return { status: 'incorrect-selected', label: 'Votre réponse (incorrecte)' };
    } else {
      return { status: 'not-selected', label: '' };
    }
  };

  return (
    <div className={`border-l-4 p-6 rounded-r-lg ${isActuallyCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
      {/* En-tête de la question */}
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-semibold text-gray-800 flex-1 text-lg">
          <span className="text-blue-600 font-bold">Question {index + 1}:</span> 
          <span className="ml-2">{question || "Texte de la question non disponible"}</span>
        </h4>
        {isActuallyCorrect ? (
          <span className="flex items-center text-sm font-medium text-green-700 bg-green-200 px-3 py-1 rounded-full ml-4">
            <CheckCircle className="w-4 h-4 mr-1" /> Correct
          </span>
        ) : (
          <span className="flex items-center text-sm font-medium text-red-700 bg-red-200 px-3 py-1 rounded-full ml-4">
            <XCircle className="w-4 h-4 mr-1" /> Incorrect
          </span>
        )}
      </div>

      {/* Affichage avec options détaillées */}
      {options && options.length > 0 ? (
        <div className="mb-6">
          <p className="font-medium text-gray-700 mb-3">Options et comparaison :</p>
          <div className="space-y-3">
            {options.map((option, optionIndex) => {
              const { status, label } = getOptionStatus(option);
              
              let className = "p-4 rounded-lg border transition";
              let icon = null;
              let textColor = 'text-gray-700';

              switch (status) {
                case 'correct-selected':
                  className += " bg-green-100 border-green-400 ring-2 ring-green-200";
                  icon = <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />;
                  textColor = 'text-green-800';
                  break;
                case 'correct-not-selected':
                  className += " bg-green-100 border-green-300";
                  icon = <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />;
                  textColor = 'text-green-800';
                  break;
                case 'incorrect-selected':
                  className += " bg-red-100 border-red-400 ring-2 ring-red-200";
                  icon = <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />;
                  textColor = 'text-red-800';
                  break;
                default:
                  className += " bg-gray-50 border-gray-200";
                  icon = <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex-shrink-0"></div>;
                  break;
              }

              return (
                <div key={optionIndex} className={className}>
                  <div className="flex items-start">
                    {icon}
                    <div className="flex-1">
                      <div className={`font-medium ${textColor}`}>
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </div>
                      {label && (
                        <div className={`text-xs mt-1 font-medium ${
                          status === 'correct-selected' ? 'text-green-600' :
                          status === 'correct-not-selected' ? 'text-green-600' :
                          'text-red-600'
                        }`}>
                          {label}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Affichage simplifié sans options détaillées
        <div className="mb-6">
          <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
            {/* Réponse de l'utilisateur */}
            <div>
              <p className="font-medium text-gray-700 mb-2">
                {isMultiChoice ? 'Vos réponses :' : 'Votre réponse :'}
              </p>
              <div className={`p-4 rounded border ${isActuallyCorrect ? 'bg-green-100 border-green-300' : 'bg-blue-100 border-blue-400 ring-2 ring-blue-200'}`}>
                <div className="flex items-start">
                  <User className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                  <div className="flex-1">
                    {selectedAnswersArray.length > 0 ? (
                      selectedAnswersArray.length === 1 ? (
                        <span>{selectedAnswersArray[0]}</span>
                      ) : (
                        <ul className="space-y-1 list-none pl-0">
                          {selectedAnswersArray.map((ans, i) => (
                            <li key={i} className="flex items-center">
                              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 flex-shrink-0"></span>
                              {ans}
                            </li>
                          ))}
                        </ul>
                      )
                    ) : (
                      <span className="text-gray-500 italic">Aucune réponse donnée</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Réponses correctes */}
            <div>
              <p className="font-medium text-gray-700 mb-2">
                {isMultiChoice ? 'Réponses correctes :' : 'Réponse correcte :'}
              </p>
              <div className="p-4 rounded border bg-green-100 border-green-300">
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                  <div className="flex-1">
                    {correctAnswersArray.length > 0 ? (
                      correctAnswersArray.length === 1 ? (
                        <span>{correctAnswersArray[0]}</span>
                      ) : (
                        <ul className="space-y-1 list-none pl-0">
                          {correctAnswersArray.map((ans, i) => (
                            <li key={i} className="flex items-center">
                              <span className="w-2 h-2 bg-green-600 rounded-full mr-2 flex-shrink-0"></span>
                              {ans}
                            </li>
                          ))}
                        </ul>
                      )
                    ) : (
                      <span className="text-red-500 italic">⚠️ Aucune réponse correcte définie</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Analyse détaillée pour choix multiples */}
          {isMultiChoice && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-800 mb-2">Analyse des réponses multiples :</p>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>• Réponses correctes attendues : <span className="font-medium">{correctAnswersArray.length}</span></div>
                    <div>• Vos réponses données : <span className="font-medium">{selectedAnswersArray.length}</span></div>
                    
                    <div className="mt-3 space-y-1">
                      <div className="font-medium">Statut de chaque réponse correcte :</div>
                      {correctAnswersArray.map((correctAns, i) => {
                        const isFound = selectedAnswersArray.some(selAns => 
                          String(selAns).toLowerCase().trim() === String(correctAns).toLowerCase().trim()
                        );
                        return (
                          <div key={i} className={`text-xs flex items-center ${isFound ? 'text-green-600' : 'text-red-600'}`}>
                            {isFound ? '✓' : '✗'} <span className="font-mono ml-1">{correctAns}</span>
                            {isFound ? ' (trouvée dans vos réponses)' : ' (manquante dans vos réponses)'}
                          </div>
                        );
                      })}
                      
                      {/* Réponses incorrectes données */}
                      {selectedAnswersArray.filter(selAns => 
                        !correctAnswersArray.some(corrAns => 
                          String(corrAns).toLowerCase().trim() === String(selAns).toLowerCase().trim()
                        )
                      ).map((incorrectAns, i) => (
                        <div key={`incorrect-${i}`} className="text-xs flex items-center text-red-600">
                          ✗ <span className="font-mono ml-1">{incorrectAns}</span> (réponse incorrecte donnée)
                        </div>
                      ))}
                      
                      {selectedAnswersArray.length === 0 && correctAnswersArray.length > 0 && (
                        <div className="text-xs flex items-center text-red-600">
                          ✗ Aucune réponse n'a été donnée pour cette question à choix multiples.
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-yellow-300">
                      <strong>Statut final :</strong>
                      {isActuallyCorrect ? (
                        <span className="text-green-600 font-medium ml-1">✓ Réponse complètement correcte</span>
                      ) : (
                        <span className="text-red-600 font-medium ml-1">✗ Réponse incomplète ou incorrecte</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section d'explication */}
      {explanation && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-800 mb-1">Explication :</p>
              <p className="text-blue-700 text-sm">{explanation}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};



export default QuizDetailPage;