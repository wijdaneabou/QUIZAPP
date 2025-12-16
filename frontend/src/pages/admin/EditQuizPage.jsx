import { useState, useEffect } from 'react';
import {Save,ArrowLeft,Plus,Trash2,Eye,Settings,Edit3,CheckCircle,AlertCircle,Loader,BookOpen,Clock,Bot} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import quizService from '../../services/quizService';

const niveaux = [
  "1ère année collège",
  "2ème année collège", 
  "3ème année collège",
  "Tronc commun scientifique",
  "Tronc commun lettres",
  "1ère année baccalauréat",
  "2ème année baccalauréat"
];

const difficulties = [
  { value: 'EASY', label: 'Facile' },
  { value: 'MEDIUM', label: 'Moyen' },
  { value: 'HARD', label: 'Difficile' }
];

const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Choix Multiple' },
  { value: 'TRUE_FALSE', label: 'Vrai/Faux' },
  { value: 'SHORT_ANSWER', label: 'Réponse Courte' }
];

const QuestionEditor = ({ question, index, updateQuestion, deleteQuestion, isEditing, setEditingQuestion }) => {
  const updateQuestionField = (field, value) => {
    updateQuestion(question.id, { [field]: value });
  };

  const updateOption = (optionId, field, value) => {
    const updatedOptions = question.options.map(opt =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    );
    updateQuestion(question.id, { options: updatedOptions });
  };

  const addOption = () => {
    const newOption = {
      id: Date.now(),
      optionText: '',
      isCorrect: false
    };
    updateQuestion(question.id, { 
      options: [...question.options, newOption] 
    });
  };

  const removeOption = (optionId) => {
    if (question.options.length <= 2) return;
    const updatedOptions = question.options.filter(opt => opt.id !== optionId);
    updateQuestion(question.id, { options: updatedOptions });
  };

  // Détecter si c'est un choix multiple
  const correctOptionsCount = question.options?.filter(opt => opt.isCorrect).length || 0;
  const isMultipleChoice = correctOptionsCount > 1;

  return (
    <div className={`bg-white border rounded-lg p-6 mb-4 transition-all ${
      isEditing ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="font-medium text-gray-900">Question {index + 1}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setEditingQuestion(isEditing ? null : question.id)}
            className={`p-2 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
            title={isEditing ? "Terminer l'édition" : "Modifier"}
          >
            {isEditing ? <CheckCircle className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => deleteQuestion(question.id)}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texte de la question
        </label>
        {isEditing ? (
          <textarea
            value={question.questionText || ''}
            onChange={(e) => updateQuestionField('questionText', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="Votre question..."
          />
        ) : (
          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
            {question.questionText || 'Question sans texte'}
          </p>
        )}
      </div>

      {/* Points */}
      {isEditing && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Points
          </label>
          <input
            type="number"
            value={question.points || 1}
            onChange={(e) => updateQuestionField('points', parseInt(e.target.value) || 1)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="1"
          />
        </div>
      )}

      {/* Options for Multiple Choice */}
      {question.type === 'MULTIPLE_CHOICE' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Options 
            
            </label>
            {isEditing && (
              <button
                onClick={addOption}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter option
              </button>
            )}
          </div>

          {isEditing && (
            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
               Cochez une ou plusieurs options pour créer un choix multiple
            </div>
          )}

          {question.options?.map((option, optIndex) => (
            <div key={option.id} className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <input
                    type="checkbox"
                    checked={option.isCorrect}
                    onChange={(e) => {
                      const updatedOptions = question.options.map(opt => 
                        opt.id === option.id 
                          ? { ...opt, isCorrect: e.target.checked }
                          : opt
                      );
                      updateQuestion(question.id, { options: updatedOptions });
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={option.optionText || ''}
                    onChange={(e) => updateOption(option.id, 'optionText', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${optIndex + 1}`}
                  />
                  {question.options.length > 2 && (
                    <button
                      onClick={() => removeOption(option.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  {isMultipleChoice ? (
                    <div className={`w-4 h-4 rounded border-2 ${
                      option.isCorrect ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    } flex items-center justify-center`}>
                      {option.isCorrect && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                  ) : (
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      option.isCorrect ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {option.isCorrect && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                    </div>
                  )}
                  <span className={`flex-1 ${option.isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                    {option.optionText || `Option ${optIndex + 1} vide`}
                  </span>
                  {option.isCorrect && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      ✓
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* True/False Options */}
      {question.type === 'TRUE_FALSE' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Réponse correcte</label>
          <div className="flex space-x-4">
            {isEditing ? (
              <>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`question_${question.id}_answer`}
                    checked={question.correctAnswer === true}
                    onChange={() => updateQuestionField('correctAnswer', true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2">Vrai</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`question_${question.id}_answer`}
                    checked={question.correctAnswer === false}
                    onChange={() => updateQuestionField('correctAnswer', false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2">Faux</span>
                </label>
              </>
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                question.correctAnswer === true ? 'bg-green-100 text-green-800' : 
                question.correctAnswer === false ? 'bg-red-100 text-red-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {question.correctAnswer === true ? 'Vrai' : 
                 question.correctAnswer === false ? 'Faux' : 
                 'Non défini'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Short Answer */}
      {question.type === 'SHORT_ANSWER' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Réponse correcte</label>
          {isEditing ? (
            <input
              type="text"
              value={question.correctAnswer || ''}
              onChange={(e) => updateQuestionField('correctAnswer', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Réponse correcte"
            />
          ) : (
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
              {question.correctAnswer || 'Aucune réponse définie'}
            </p>
          )}
        </div>
      )}

      {/* Explanation */}
      {isEditing && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Explication 
          </label>
          <textarea
            value={question.explanation || ''}
            onChange={(e) => updateQuestionField('explanation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows="2"
            placeholder="Explication de la réponse..."
          />
        </div>
      )}
    </div>
  );
};

const EditQuizPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [quiz, setQuiz] = useState({
    title: '',
    subject: '',
    niveau: '',
    difficulty: 'EASY',
    timeLimit: 30,
    isAIGenerated: false
  });
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [errors, setErrors] = useState({});

  // Charger le quiz existant
  useEffect(() => {
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

  
      // Récupérer le quiz
      const quizData = await quizService.getQuizById(id);
      
      setQuiz({
        title: quizData.title || '',
        subject: quizData.subject || '',
        niveau: quizData.niveau || '',
        difficulty: quizData.difficulty || 'EASY',
        timeLimit: quizData.timeLimit || 30,
        isAIGenerated: quizData.isAIGenerated || false
      });

      // Récupérer les questions
      const questionsData = await quizService.quizTaking.getQuestionsByQuizId(id);
      console.log('Questions récupérées:', questionsData);
      
      // Transformer les questions pour le format attendu
      const formattedQuestions = questionsData.map(q => {
        const baseQuestion = {
          id: q.id,
          questionText: q.questionText,
          points: q.points || 1,
          explanation: q.explanation || ''
        };

        // Utiliser directement les answers si disponibles
        if (q.answers && Array.isArray(q.answers)) {
          const correctAnswersCount = q.answers.filter(a => a.isCorrect).length;
          
          if (correctAnswersCount > 1 || (q.answers.length > 2 && correctAnswersCount >= 1)) {
            // Question à choix multiples
            return {
              ...baseQuestion,
              type: 'MULTIPLE_CHOICE',
              options: q.answers.map((answer, idx) => ({
                id: answer.id || idx + 1,
                optionText: answer.answerText,
                isCorrect: answer.isCorrect
              }))
            };
          } else if (q.answers.length === 2 && 
                     q.answers.some(a => a.answerText === 'Vrai' || a.answerText === 'Faux')) {
            // Question Vrai/Faux
            return {
              ...baseQuestion,
              type: 'TRUE_FALSE',
              correctAnswer: q.answers.find(a => a.isCorrect)?.answerText === 'Vrai'
            };
          } else if (q.answers.length === 1) {
            // Réponse courte
            return {
              ...baseQuestion,
              type: 'SHORT_ANSWER',
              correctAnswer: q.answers.find(a => a.isCorrect)?.answerText || ''
            };
          } else {
            // Question à choix unique
            return {
              ...baseQuestion,
              type: 'MULTIPLE_CHOICE',
              options: q.answers.map((answer, idx) => ({
                id: answer.id || idx + 1,
                optionText: answer.answerText,
                isCorrect: answer.isCorrect
              }))
            };
          }
        }
        
        // Fallback : utiliser l'ancienne méthode
        else if (q.options && q.options.length > 2) {
          console.warn(' Question sans answers, utilisation fallback avec correctAnswer unique');
          return {
            ...baseQuestion,
            type: 'MULTIPLE_CHOICE',
            options: q.options.map((optText, idx) => ({
              id: idx + 1,
              optionText: optText,
              isCorrect: idx === q.correctAnswer
            }))
          };
        } else if (q.options && q.options.length === 2 && 
                   (q.options.includes('Vrai') || q.options.includes('Faux'))) {
          return {
            ...baseQuestion,
            type: 'TRUE_FALSE',
            correctAnswer: q.correctAnswerText === 'Vrai'
          };
        } else {
          return {
            ...baseQuestion,
            type: 'SHORT_ANSWER',
            correctAnswer: q.correctAnswerText || ''
          };
        }
      });
      
      
      //  afficher les questions avec choix multiples
      formattedQuestions.forEach((q, index) => {
        if (q.type === 'MULTIPLE_CHOICE') {
          const correctCount = q.options.filter(opt => opt.isCorrect).length;
          console.log(`Question ${index + 1}: ${correctCount} réponse(s) correcte(s)`, q.options);
        }
      });
      
      setQuestions(formattedQuestions);
      
    } catch (error) {
      console.error('Erreur lors du chargement du quiz:', error);
      setError('Impossible de charger le quiz: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createNewQuestion = (type = 'MULTIPLE_CHOICE') => {
    const baseQuestion = {
      id: Date.now(),
      type,
      questionText: '',
      points: 1,
      explanation: ''
    };

    switch (type) {
      case 'MULTIPLE_CHOICE':
        return {
          ...baseQuestion,
          options: [
            { id: 1, optionText: '', isCorrect: false },
            { id: 2, optionText: '', isCorrect: false },
            { id: 3, optionText: '', isCorrect: false },
            { id: 4, optionText: '', isCorrect: false }
          ]
        };
      case 'TRUE_FALSE':
        return {
          ...baseQuestion,
          correctAnswer: true
        };
      case 'SHORT_ANSWER':
        return {
          ...baseQuestion,
          correctAnswer: ''
        };
      default:
        return baseQuestion;
    }
  };

  const addQuestion = (type) => {
  const newQuestion = createNewQuestion(type);
  console.log('Nouvelle question créée:', newQuestion); // Pour déboguer
  setQuestions([...questions, newQuestion]);
  setEditingQuestion(newQuestion.id);
  
  // Scroll vers la nouvelle question
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, 100);
};

  const updateQuestion = (questionId, updates) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (questionId) => {
    if (questions.length <= 1) {
      alert('Un quiz doit contenir au moins une question.');
      return;
    }
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      setQuestions(questions.filter(q => q.id !== questionId));
      if (editingQuestion === questionId) {
        setEditingQuestion(null);
      }
    }
  };

  const validateQuiz = () => {
    const newErrors = {};
    
    if (!quiz.title?.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    
    if (!quiz.subject?.trim()) {
      newErrors.subject = 'Le sujet est requis';
    }
    
    if (!quiz.niveau) {
      newErrors.niveau = 'Le niveau est requis';
    }

    if (questions.length === 0) {
      newErrors.questions = 'Au moins une question est requise';
    } else {
      const invalidQuestions = questions.filter(q => {
        if (!q.questionText?.trim()) return true;
        
        if (q.type === 'MULTIPLE_CHOICE') {
          const hasValidOptions = q.options?.some(opt => opt.optionText?.trim());
          const hasCorrectAnswer = q.options?.some(opt => opt.isCorrect);
          return !hasValidOptions || !hasCorrectAnswer;
        }
        
        if (q.type === 'TRUE_FALSE') {
          return q.correctAnswer === undefined || q.correctAnswer === null;
        }
        
        if (q.type === 'SHORT_ANSWER') {
          return !q.correctAnswer?.trim();
        }
        
        return false;
      });

      if (invalidQuestions.length > 0) {
        newErrors.questions = `${invalidQuestions.length} question(s) incomplète(s)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveQuiz = async () => {
    if (!validateQuiz()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await quizService.updateQuiz(id, quiz);
      
      // 2. Traiter chaque question
      for (const question of questions) {
        try {
          // Préparer les données de la question selon son type
          let questionUpdateData = {
            questionText: question.questionText,
            points: question.points || 1,
            explanation: question.explanation || ''
          };

          // Si c'est une nouvelle question 
          if (question.id > 1000000000000) { 
            // Créer la question
            const createdQuestion = await quizService.createQuestions(id, [questionUpdateData]);
            const newQuestionId = createdQuestion[0]?.id || createdQuestion.id;
            
            // Créer les réponses selon le type
            if (question.type === 'MULTIPLE_CHOICE') {
              const answers = question.options.map(option => ({
                answerText: option.optionText,
                isCorrect: option.isCorrect
              }));
              await quizService.updateAnswers(newQuestionId, answers);
            } else if (question.type === 'TRUE_FALSE') {
              const answers = [
                { answerText: 'Vrai', isCorrect: question.correctAnswer === true },
                { answerText: 'Faux', isCorrect: question.correctAnswer === false }
              ];
              await quizService.updateAnswers(newQuestionId, answers);
            } else if (question.type === 'SHORT_ANSWER') {
              const answers = [
                { answerText: question.correctAnswer, isCorrect: true }
              ];
              await quizService.updateAnswers(newQuestionId, answers);
            }
            
          } else {  
            await quizService.updateQuestion(question.id, questionUpdateData);
            
      
            if (question.type === 'MULTIPLE_CHOICE') {
              const answers = question.options.map(option => ({
                answerText: option.optionText,
                isCorrect: option.isCorrect
              }));
              await quizService.updateAnswers(question.id, answers);
              
            } else if (question.type === 'TRUE_FALSE') {
              const answers = [
                { answerText: 'Vrai', isCorrect: question.correctAnswer === true },
                { answerText: 'Faux', isCorrect: question.correctAnswer === false }
              ];
              await quizService.updateAnswers(question.id, answers);
              
            } else if (question.type === 'SHORT_ANSWER') {
              const answers = [
                { answerText: question.correctAnswer, isCorrect: true }
              ];
              await quizService.updateAnswers(question.id, answers);
            }
          }
          
        } catch (questionError) {
          console.error(` Erreur pour la question ${question.id}:`, questionError);
          throw new Error(`Erreur pour la question "${question.questionText}": ${questionError.message}`);
        }
      }
      
      navigate('/admin/quiz-management');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde complète:', error);
      setError('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  if (error && !quiz.title) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={loadQuiz}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Réessayer
            </button>
            <button 
              onClick={() => navigate('/admin/quiz-management')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/quiz-management')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Éditer le Quiz</h1>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => navigate(`/admin/quiz-preview/${id}`)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Aperçu
              </button>
              <button
                onClick={saveQuiz}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Configuration du Quiz */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-6">
            <Settings className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Configuration du Quiz</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Titre du quiz"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet *
                </label>
                <input
                  type="text"
                  value={quiz.subject}
                  onChange={(e) => setQuiz({ ...quiz, subject: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Mathématiques, Histoire, etc."
                />
                {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau *
                  </label>
                  <select
                    value={quiz.niveau}
                    onChange={(e) => setQuiz({ ...quiz, niveau: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.niveau ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner</option>
                    {niveaux.map((niveau) => (
                      <option key={niveau} value={niveau}>{niveau}</option>
                    ))}
                  </select>
                  {errors.niveau && <p className="text-red-500 text-sm mt-1">{errors.niveau}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulté
                  </label>
                  <select
                    value={quiz.difficulty}
                    onChange={(e) => setQuiz({ ...quiz, difficulty: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {difficulties.map((diff) => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (minutes)
                </label>
                <input
                  type="number"
                  value={quiz.timeLimit}
                  onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border">
              <div className="text-center mb-6">
                <Bot className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quiz généré par IA</h3>
                {quiz.isAIGenerated ? (
                  <div className="flex items-center justify-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Ce quiz a été généré par IA
                  </div>
                ) : (
                  <p className="text-gray-600">Ce quiz a été créé manuellement</p>
                )}
              </div>
              
              <div className="space-y-3 text-sm text-gray-500">
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {questions.length} questions
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {quiz.timeLimit} minutes
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Edit3 className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Questions</h2>
    
            </div>

            <div className="flex space-x-2">
              {questionTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => addQuestion(type.value)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {errors.questions && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-600">{errors.questions}</p>
              </div>
            </div>
          )}

          {questions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune question</p>
              <p className="text-gray-400 text-sm">Cliquez sur un type de question pour ajouter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  updateQuestion={updateQuestion}
                  deleteQuestion={deleteQuestion}
                  isEditing={editingQuestion === question.id}
                  setEditingQuestion={setEditingQuestion}
                />
              ))}
            </div>
          )}

          {/* Actions en bas */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {questions.length === 0 ? (
                  <span className="text-red-500">Aucune question ajoutée</span>
                ) : (
                  <span>
                    {questions.length} question{questions.length > 1 ? 's' : ''} • 
                    {editingQuestion ? ' Mode édition activé' : ' Cliquez sur une question pour l\'éditer'}
                  </span>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler l'édition
                </button>
                <button
                  onClick={() => navigate(`/admin/quiz/${id}`)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions flottantes */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <button
            onClick={saveQuiz}
            disabled={saving || Object.keys(errors).length > 0}
            className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            title="Sauvegarder le quiz"
          >
            {saving ? (
              <Loader className="w-6 h-6 animate-spin" />
            ) : (
              <Save className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
            title="Remonter en haut"
          >
            <ArrowLeft className="w-5 h-5 rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuizPage;