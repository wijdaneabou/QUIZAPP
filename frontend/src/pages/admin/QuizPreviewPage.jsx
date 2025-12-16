import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, ArrowUp, ArrowDown, Save, Send, ArrowLeft, Sparkles } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { getQuizById, updateQuiz } from '../../services/quizService';
import api from '../../api/axios';
import { authService } from '../../services/authService';

const QuizPreviewPage = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localQuestions, setLocalQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  const fetchQuizData = useCallback(async () => {
    if (!quizId) {
      setError("Aucun ID de quiz n'a été fourni.");
      setLoading(false);
      return;
    }

    const parsedQuizId = parseInt(quizId);
    if (isNaN(parsedQuizId)) {
      setError(`ID de quiz invalide: "${quizId}"`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const quizData = await getQuizById(parsedQuizId);
      if (!quizData) {
        throw new Error("Quiz non trouvé.");
      }
      setQuiz(quizData);

      if (quizData.questions && Array.isArray(quizData.questions)) {
        setLocalQuestions(quizData.questions);
      } else {
        try {
          const questionsResponse = await api.get(`/questions/quiz/${parsedQuizId}`);
          const questionsData = questionsResponse.data || [];
          if (questionsData.length > 0) {
            const formattedQuestions = await Promise.all(
              questionsData.map(async (question) => {
                const answersResponse = await api.get(`/answers/question/${question.id}`);
                const answers = answersResponse.data || [];
                return {
                  id: question.id,
                  questionText: question.questionText,
                  points: question.points || 1,
                  explanation: question.explanation,
                  answers: answers.map(answer => ({
                    id: answer.id,
                    answerText: answer.answerText,
                    isCorrect: answer.isCorrect
                  }))
                };
              })
            );
            setLocalQuestions(formattedQuestions);
          }
        } catch (questionError) {
          console.error('Erreur lors de la récupération des questions:', questionError);
          setError("Erreur lors de la récupération des questions.");
          setLocalQuestions([]);
        }
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  // Fonction pour mettre à jour une question dans la base de données
  const updateQuestionInDB = async (questionData) => {
    try {
    
      const questionUpdateData = {
        questionText: questionData.questionText.trim(),
        points: parseInt(questionData.points) || 1,
        explanation: questionData.explanation?.trim() || ''
      };

      const questionResponse = await api.put(`/questions/${questionData.id}`, questionUpdateData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

  
      // Mettre à jour chaque réponse
      if (questionData.answers && questionData.answers.length > 0) {
        const answerUpdatePromises = questionData.answers.map(async (answer) => {
          const answerUpdateData = {
            answerText: answer.answerText.trim(),
            isCorrect: Boolean(answer.isCorrect)
          };

          try {
            const answerResponse = await api.put(`/answers/${answer.id}`, answerUpdateData, {
              timeout: 10000,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
        
            return answerResponse.data;
          } catch (answerError) {
            console.error(` Erreur mise à jour réponse ${answer.id}:`, answerError);
            throw answerError;
          }
        });

        await Promise.all(answerUpdatePromises);
  
      }

      return questionResponse.data;

    } catch (error) {
      console.error(' Erreur lors de la mise à jour de la question:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        const message = errorData?.message || errorData?.error || `Erreur HTTP ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Erreur réseau. Vérifiez que le serveur backend est accessible.');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Timeout lors de la mise à jour de la question.');
        } else {
          throw new Error('Aucune réponse du serveur lors de la mise à jour.');
        }
      } else {
        throw new Error('Erreur lors de la configuration de la requête: ' + error.message);
      }
    }
  };
  // Ajoutez cette fonction après les autres fonctions handle dans votre composant
  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now(), // ID temporaire pour les nouvelles questions
      questionText: '',
      points: 1,
      explanation: '',
      answers: [
        { id: Date.now() + 1, answerText: '', isCorrect: false },
        { id: Date.now() + 2, answerText: '', isCorrect: false },
        { id: Date.now() + 3, answerText: '', isCorrect: false },
        { id: Date.now() + 4, answerText: '', isCorrect: false }
      ]
    };
    
    setEditingQuestion(newQuestion);
    setIsEditModalOpen(true);
  };
  const handlePublish = async () => {
    if (!quiz) {
      alert('Aucun quiz à publier');
      return;
    }
  
    try {
      // Récupérer le creatorId depuis authService
      let creatorId = quiz.creatorId;
      
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          creatorId = parseInt(currentUser.id);
        }
      } catch (authError) {
        console.warn('authService non disponible:', authError);
      }
      
      const publishData = {
        title: quiz.title || 'Quiz sans titre',
        subject: quiz.subject || 'Général',
        niveau: quiz.niveau || 'Débutant',
        difficulty: quiz.difficulty || 'MEDIUM',
        timeLimit: quiz.timeLimit || 30,
        isAIGenerated: quiz.isAIGenerated || false,
        creatorId: creatorId // Utiliser le creatorId récupéré
      };
      const response = await updateQuiz(quiz.id, publishData);
    
      setQuiz(prev => ({ ...prev, ...response, isPublished: true }));
      await fetchQuizData();
      navigate('/admin/quiz-management');
      
    } catch (err) {
      console.error('Erreur publication:', err);
      alert(`Erreur de publication: ${err.message}`);
    }
  };

  // Updated handleSave function
  const handleSave = async () => {
    if (!quiz) {
      alert('Aucun quiz à sauvegarder');
      return;
    }
    
    try {    
      const saveData = {
        title: quiz.title?.trim() || 'Quiz sans titre',
        subject: quiz.subject?.trim() || 'Général',
        niveau: quiz.niveau || 'Débutant', 
        difficulty: quiz.difficulty?.toUpperCase() || 'MEDIUM',
        timeLimit: parseInt(quiz.timeLimit) || 30,
        isAIGenerated: Boolean(quiz.isAIGenerated) || false
      };   
      const response = await updateQuiz(quiz.id, saveData);
      navigate('/admin/quiz-management');
      
      if (response && response.id) {
        setQuiz(prev => ({
          ...prev,
          ...response
        }));
      }
      
  
      await fetchQuizData();
      
    } catch (err) {
      alert(`Erreur de sauvegarde: ${err.message || err}`);
    }
  };

  const handleDeleteQuestion = (questionId) => {
    setLocalQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleMoveQuestion = (questionId, direction) => {
    const currentIndex = localQuestions.findIndex(q => q.id === questionId);
    if ((direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === localQuestions.length - 1)) return;

    const newQuestions = [...localQuestions];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newQuestions[currentIndex], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[currentIndex]];
    setLocalQuestions(newQuestions);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

 
  const handleSaveQuestion = async (updatedQuestion) => {
    setIsSavingQuestion(true);
    
    try {
      
      if (!updatedQuestion.questionText?.trim()) {
        throw new Error('Le texte de la question est requis');
      }

      if (!updatedQuestion.answers || updatedQuestion.answers.length === 0) {
        throw new Error('Au moins une réponse est requise');
      }

      const hasCorrectAnswer = updatedQuestion.answers.some(answer => answer.isCorrect);
      if (!hasCorrectAnswer) {
        throw new Error('Au moins une réponse correcte doit être sélectionnée');
      }

 
      await updateQuestionInDB(updatedQuestion);
      
  
      setLocalQuestions(prev =>
        prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
      );
 
      setIsEditModalOpen(false);
      setEditingQuestion(null);
      
     
      alert('Question modifiée et sauvegardée avec succès ! ');
  
      await fetchQuizData();
      
    } catch (error) {
      console.error(' Erreur lors de la sauvegarde de la question:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message}`);
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const EditQuestionModal = ({ question, onClose, onSave }) => {
    const [editedQuestion, setEditedQuestion] = useState(question);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setEditedQuestion(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleAnswerChange = (answerId, field, value) => {
      setEditedQuestion(prev => ({
        ...prev,
        answers: prev.answers.map(answer =>
          answer.id === answerId ? { ...answer, [field]: value } : answer
        )
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!editedQuestion.questionText?.trim()) {
        alert('Le texte de la question est requis');
        return;
      }

      if (!editedQuestion.answers || editedQuestion.answers.length === 0) {
        alert('Au moins une réponse est requise');
        return;
      }

      const hasCorrectAnswer = editedQuestion.answers.some(answer => answer.isCorrect);
      if (!hasCorrectAnswer) {
        alert('Au moins une réponse correcte doit être sélectionnée');
        return;
      }

      const hasEmptyAnswers = editedQuestion.answers.some(answer => !answer.answerText?.trim());
      if (hasEmptyAnswers) {
        alert('Toutes les réponses doivent avoir un texte');
        return;
      }

      onSave(editedQuestion);
    };

    return (
      <Transition appear show={true} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <Edit className="w-5 h-5 mr-2 text-blue-500" />
                    Modifier la question
                    {isSavingQuestion && (
                      <span className="ml-2 text-sm text-blue-500 animate-pulse">
                        Sauvegarde en cours...
                      </span>
                    )}
                  </Dialog.Title>
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Question *
                      </label>
                      <input
                        type="text"
                        name="questionText"
                        value={editedQuestion.questionText}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                        disabled={isSavingQuestion}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Points
                      </label>
                      <input
                        type="number"
                        name="points"
                        value={editedQuestion.points || 1}
                        onChange={handleChange}
                        min="1"
                        max="10"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                        disabled={isSavingQuestion}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Explication
                      </label>
                      <textarea
                        name="explanation"
                        value={editedQuestion.explanation || ''}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={isSavingQuestion}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Réponses *
                        <span className="text-xs text-gray-500 ml-2">
                          (Cochez la ou les bonnes réponses)
                        </span>
                      </label>
                      {editedQuestion.answers.map((answer) => (
                        <div key={answer.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={answer.isCorrect}
                            onChange={(e) => handleAnswerChange(answer.id, 'isCorrect', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={isSavingQuestion}
                          />
                          <input
                            type="text"
                            value={answer.answerText}
                            onChange={(e) => handleAnswerChange(answer.id, 'answerText', e.target.value)}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                            disabled={isSavingQuestion}
                            placeholder="Texte de la réponse..."
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSavingQuestion}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingQuestion}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:bg-gray-400"
                      >
                        {isSavingQuestion ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Enregistrer 
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  };

  const QuestionCard = ({ question, index }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mr-3">
            Question {index + 1}
          </span>
          <span className="text-sm text-gray-500">{question.points || 1} point(s)</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleMoveQuestion(question.id, 'up')}
            disabled={index === 0}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Déplacer vers le haut"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleMoveQuestion(question.id, 'down')}
            disabled={index === localQuestions.length - 1}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Déplacer vers le bas"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditQuestion(question)}
            className="p-2 text-blue-500 hover:text-blue-700"
            title="Modifier la question"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteQuestion(question.id)}
            className="p-2 text-red-500 hover:text-red-700"
            title="Supprimer la question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-4">{question.questionText}</h3>
      <div className="space-y-2 mb-4">
        {question.answers && question.answers.map((answer) => (
          <div
            key={answer.id}
            className={`p-3 rounded-lg border-2 ${
              answer.isCorrect
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-gray-200 bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                answer.isCorrect ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}>
                {answer.isCorrect && (
                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                )}
              </div>
              {answer.answerText}
            </div>
          </div>
        ))}
      </div>
      {question.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-800 mb-1">Explication :</h4>
          <p className="text-blue-700 text-sm">{question.explanation}</p>
        </div>
      )}
    </div>
  );

  if (loading) return <div className="text-center p-10 text-xl">Chargement du quiz...</div>;
  if (error) return <div className="text-center p-10 text-xl text-red-500">Erreur : {error}</div>;
  if (!quiz) return <div className="text-center p-10 text-xl">Quiz introuvable.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </button>
            <button
              onClick={handlePublish}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Publier
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center mb-4">
            <Sparkles className="w-6 h-6 text-purple-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">{quiz.title}</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div><span className="font-medium">Sujet :</span> {quiz.subject}</div>
            <div><span className="font-medium">Niveau :</span> {quiz.niveau}</div>
            <div><span className="font-medium">Créé le :</span> {new Date(quiz.createdAt).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Questions du Quiz</h2>
            <button 
              onClick={handleAddQuestion}

              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une question
            </button>
          </div>
          {localQuestions.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="text-yellow-600 mb-2"> Aucune question trouvée</div>
              <p className="text-yellow-700 text-sm mb-4">
                Ce quiz ne contient pas encore de questions.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Ajouter des questions manuellement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {localQuestions.map((question, index) => (
                <QuestionCard key={question.id} question={question} index={index} />
              ))}
            </div>
          )}
        </div>
        {isEditModalOpen && editingQuestion && (
          <EditQuestionModal
            question={editingQuestion}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveQuestion}
          />
        )}
      </div>
    </div>
  );
};

export default QuizPreviewPage;