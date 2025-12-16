import { useState } from 'react';
import {  Trash2, Eye, ArrowLeft, ArrowRight, Clock, BookOpen, Settings, Bot, CheckCircle, Edit3, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import { authService } from '../../services/authService';


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

const ConfigurationStep = ({ quiz, setQuiz, errors, navigate }) => {
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration du Quiz</h2>
          <p className="text-gray-600">Définissez les paramètres de base</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Sujet *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Niveau *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulté</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Durée (minutes)</label>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Génération IA</h3>
              <p className="text-gray-600">Laissez l'IA créer votre quiz automatiquement</p>
            </div>
            {errors.ai && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.ai}
                </p>
              </div>
            )}
            <button
              onClick={() => navigate('/admin/ai-generator')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center font-medium transition-all disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Générer avec l'IA
            </button>
            <div className="mt-4 text-sm text-gray-500">
              <p>• Questions adaptées au niveau</p>
              <p>• Réponses automatiques</p>
              <p>• Gain de temps considérable</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuestionEditor = ({ question, index, updateQuestion, deleteQuestion }) => {
    const updateQuestionField = (field, value) => {
      updateQuestion(question.id, { [field]: value });
    };
  
    const updateOption = (optionId, field, value) => {
      const updatedOptions = question.options.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      );
      updateQuestion(question.id, { options: updatedOptions });
    };
  
    return (
      <div className="bg-white border rounded-lg p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium text-gray-900">Question {index + 1}</span>
          <button
            onClick={() => deleteQuestion(question.id)}
            className="text-red-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="mb-4">
          <textarea
            value={question.questionText}
            onChange={(e) => updateQuestionField('questionText', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows="2"
            placeholder="Votre question..."
          />
        </div>
        {question.type === 'MULTIPLE_CHOICE' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-2">Cochez une ou plusieurs réponses correctes</p>
            {question.options.map((option, optIndex) => (
              <div key={option.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={option.isCorrect}
                  onChange={() => {
                    const updatedOptions = question.options.map(opt => ({
                      ...opt,
                      isCorrect: opt.id === option.id ? !opt.isCorrect : opt.isCorrect
                    }));
                    updateQuestion(question.id, { options: updatedOptions });
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <input
                  type="text"
                  value={option.optionText}
                  onChange={(e) => updateOption(option.id, 'optionText', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${optIndex + 1}`}
                />
                {option.isCorrect && (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
        {question.type === 'TRUE_FALSE' && (
          <div className="flex space-x-4">
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
          </div>
        )}
        {question.type === 'SHORT_ANSWER' && (
          <input
            type="text"
            value={question.correctAnswer}
            onChange={(e) => updateQuestionField('correctAnswer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Réponse correcte"
          />
        )}
      </div>
    );
  };

const QuestionsStep = ({ questions, addQuestion, updateQuestion, deleteQuestion, errors, questionTypes }) => {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Questions</h2>
        <div className="flex space-x-2">
          {questionTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => addQuestion(type.value)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + {type.label}
            </button>
          ))}
        </div>
      </div>

      {errors.questions && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{errors.questions}</p>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune question ajoutée</p>
          <p className="text-gray-400 text-sm">Cliquez sur un type de question pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              updateQuestion={updateQuestion}
              deleteQuestion={deleteQuestion}
            />
          ))}
        </div>
      )}
    </div>
  );
};
const AddQuizPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [quiz, setQuiz] = useState({
    title: '',
    subject: '',
    niveau: '',
    difficulty: 'EASY',
    timeLimit: 30,
    isAIGenerated: false,
    description: ''
  });
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 0, title: 'Configuration', icon: Settings },
    { id: 1, title: 'Questions', icon: Edit3 },
    { id: 2, title: 'Aperçu', icon: Eye },
    { id: 3, title: 'Publication', icon: CheckCircle }
  ];

  const questionTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Choix Multiple' },
    { value: 'TRUE_FALSE', label: 'Vrai/Faux' },
    { value: 'SHORT_ANSWER', label: 'Réponse Courte' }
  ];

  const createNewQuestion = (type = 'MULTIPLE_CHOICE') => {
    const baseQuestion = {
      id: Date.now(),
      type,
      questionText: '',
      points: 1
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
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (questionId, updates) => {
    setQuestions(questions.map(q => q.id === questionId ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0) {
      if (!quiz.title.trim()) newErrors.title = 'Le titre est requis';
      if (!quiz.subject.trim()) newErrors.subject = 'Le sujet est requis';
      if (!quiz.niveau) newErrors.niveau = 'Le niveau est requis';
    }
    if (step === 1) {
      if (questions.length === 0) {
        newErrors.questions = 'Au moins une question est requise';
      } else {
    
        const invalidQuestions = questions.filter(q => {
          if (!q.questionText.trim()) return true;
          
          if (q.type === 'MULTIPLE_CHOICE') {
            const hasValidOptions = q.options.some(opt => opt.optionText.trim());
            const hasCorrectAnswer = q.options.some(opt => opt.isCorrect);
            return !hasValidOptions || !hasCorrectAnswer;
          }
          if (q.type === 'TRUE_FALSE') {
            return q.correctAnswer === undefined || q.correctAnswer === null;
          }
          if (q.type === 'SHORT_ANSWER') {
            return !q.correctAnswer || !q.correctAnswer.trim();
          }
          return false;
        });
        
        if (invalidQuestions.length > 0) {
          newErrors.questions = 'Toutes les questions doivent avoir un texte et une réponse correcte';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

     // Version corrigée de la fonction publishQuiz
const publishQuiz = async () => {
    if (!validateStep(1)) {
      return;
    }

    setIsPublishing(true);
    setErrors({});
    
    try {
      // === ÉTAPE 1: Validation de l'utilisateur ===
      let creatorId = null;
      
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          creatorId = parseInt(currentUser.id);
        }
      } catch (authError) {
        console.warn('⚠️ authService non disponible:', authError);
      }
      
      // === ÉTAPE 2: Validation et préparation des questions ===
      const validQuestions = questions.filter(q => {
        if (!q.questionText || !q.questionText.trim()) {
          console.warn('Question sans texte ignorée:', q);
          return false;
        }
        
        if (q.type === 'MULTIPLE_CHOICE') {
          const hasValidOptions = q.options && q.options.some(opt => opt.optionText && opt.optionText.trim());
          const hasCorrectAnswer = q.options && q.options.some(opt => opt.isCorrect);
          
          if (!hasValidOptions || !hasCorrectAnswer) {
            console.warn('Question à choix multiples invalide:', q);
            return false;
          }
          return true;
        }
        
        if (q.type === 'TRUE_FALSE') {
          const isValid = q.correctAnswer !== undefined && q.correctAnswer !== null;
          if (!isValid) {
            console.warn('Question Vrai/Faux invalide:', q);
          }
          return isValid;
        }
        
        if (q.type === 'SHORT_ANSWER') {
          const isValid = q.correctAnswer && q.correctAnswer.trim();
          if (!isValid) {
            console.warn('Question à réponse courte invalide:', q);
          }
          return isValid;
        }
        
        return false;
      });

      if (validQuestions.length === 0) {
        setErrors({ 
          publish: 'Aucune question valide trouvée. Veuillez vérifier vos questions et leurs réponses.' 
        });
        return;
      }

      // === ÉTAPE 3: Préparation des données du quiz ===
      const quizData = {
        title: quiz.title.trim(),
        subject: quiz.subject.trim(),
        niveau: quiz.niveau,
        difficulty: quiz.difficulty || 'EASY',
        timeLimit: parseInt(quiz.timeLimit) || 30,
        isAIGenerated: Boolean(quiz.isAIGenerated)
      };


      // === ÉTAPE 4: Création du quiz ===
      const createdQuizResponse = await quizService.createQuiz(quizData, creatorId);
      
      let createdQuiz;
      
      if (createdQuizResponse && typeof createdQuizResponse === 'object') {
        if (createdQuizResponse.success && createdQuizResponse.data) {
          createdQuiz = createdQuizResponse.data;
        } else if (createdQuizResponse.id || createdQuizResponse.success) {
          createdQuiz = {
            id: createdQuizResponse.id,
            title: createdQuizResponse.title,
            subject: createdQuizResponse.subject,
            niveau: createdQuizResponse.niveau,
            difficulty: createdQuizResponse.difficulty,
            timeLimit: createdQuizResponse.timeLimit,
            isAIGenerated: createdQuizResponse.isAIGenerated
          };
        }
      }
      
      if (!createdQuiz || !createdQuiz.id) {
        throw new Error('Le serveur n\'a pas retourné un quiz valide avec un ID');
      }

      // === ÉTAPE 5: Préparation des questions ===
      const questionsPayload = validQuestions.map((q, index) => {
        const baseQuestion = {
          questionText: q.questionText.trim(),
          points: parseInt(q.points) || 1,
          questionOrder: index + 1,
          explanation: q.explanation || null
        };

        if (q.type === 'MULTIPLE_CHOICE') {
          baseQuestion.answers = q.options
            .filter(opt => opt.optionText && opt.optionText.trim())
            .map((opt, optIndex) => ({
              answerText: opt.optionText.trim(),
              isCorrect: Boolean(opt.isCorrect),
              choiceOrder: optIndex + 1
            }));
        } else if (q.type === 'TRUE_FALSE') {
          baseQuestion.answers = [
            { answerText: "Vrai", isCorrect: q.correctAnswer === true, choiceOrder: 1 },
            { answerText: "Faux", isCorrect: q.correctAnswer === false, choiceOrder: 2 }
          ];
        } else if (q.type === 'SHORT_ANSWER') {
          baseQuestion.answers = [{
            answerText: q.correctAnswer.trim(),
            isCorrect: true,
            choiceOrder: 1
          }];
        }

        return baseQuestion;
      });

      // === ÉTAPE 6: Création des questions ===
      try {
        await quizService.createQuestions(createdQuiz.id, questionsPayload);
      } catch (questionError) {
        console.error('Erreur lors de la création des questions:', questionError);
        
        try {
          await quizService.deleteQuiz(createdQuiz.id);
        } catch (deleteError) {
          console.error('Impossible de supprimer le quiz:', deleteError);
        }
        
        throw new Error(`Erreur lors de la création des questions: ${questionError.message || questionError}`);
      }
      
      navigate('/admin/quiz-management');

    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      setErrors({
        publish: errorMessage
      });
              
    } finally {
      setIsPublishing(false);
    }
  };
  const PreviewStep = () => (
    <div className="w-full">
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {questions.length} questions
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {quiz.timeLimit} minutes
            </span>
            <span>Sujet: {quiz.subject}</span>
            <span>Niveau: {quiz.niveau}</span>
            {quiz.isAIGenerated && (
              <span className="flex items-center text-blue-600">
                <Bot className="w-4 h-4 mr-1" />
                Généré par IA
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-3">{question.questionText}</h3>
                    {question.type === 'MULTIPLE_CHOICE' && (
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <input type="radio" disabled className="w-4 h-4" />
                            <span className="text-sm text-gray-700">{option.optionText}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {question.type === 'TRUE_FALSE' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="radio" disabled className="w-4 h-4" />
                          <span className="text-sm text-gray-700">Vrai</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" disabled className="w-4 h-4" />
                          <span className="text-sm text-gray-700">Faux</span>
                        </div>
                      </div>
                    )}
                    {question.type === 'SHORT_ANSWER' && (
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Votre réponse..."
                        disabled
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
  const PublicationStep = () => (
    <div className="w-full max-w-2xl mx-auto text-center">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Prêt à publier </h2>
      <div className="bg-white rounded-lg border p-8 mb-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Questions</h3>
            <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Durée</h3>
            <p className="text-2xl font-bold text-green-600">{quiz.timeLimit} min</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Difficulté</h3>
            <p className="text-2xl font-bold text-purple-600">
              {difficulties.find(d => d.value === quiz.difficulty)?.label}
            </p>
          </div>
        </div>
        {errors.publish && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {errors.publish}
            </p>
          </div>
        )}
        <button
          onClick={publishQuiz}
          disabled={isPublishing}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-lg hover:from-green-700 hover:to-green-800 flex items-center justify-center font-medium text-lg transition-colors disabled:opacity-50"
        >
          {isPublishing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Publication en cours...
            </>
          ) : (
            <>
              Publier le Quiz
            </>
          )}
        </button>
      </div>
    </div>
  );

  const StepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            currentStep === index
              ? 'bg-blue-600 text-white'
              : currentStep > index
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
          }`}>
            <step.icon className="w-4 h-4" />
            <span className="font-medium text-sm">{step.title}</span>
          </div>
          {index < steps.length - 1 && (
            <ArrowRight className={`w-4 h-4 mx-2 ${
              currentStep > index ? 'text-green-500' : 'text-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const NavigationButtons = () => (
    <div className="flex justify-between items-center mt-8">
      <button
        onClick={prevStep}
        disabled={currentStep === 0}
        className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
          currentStep === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Précédent
      </button>
      {currentStep < steps.length - 1 && (
        <button
          onClick={nextStep}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Suivant
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      )}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <ConfigurationStep quiz={quiz} setQuiz={setQuiz} errors={errors} navigate={navigate} />;
      case 1: return <QuestionsStep questions={questions} addQuestion={addQuestion} updateQuestion={updateQuestion} deleteQuestion={deleteQuestion} errors={errors} questionTypes={questionTypes} />;
      case 2: return <PreviewStep />;
      case 3: return <PublicationStep />;
      default: return <ConfigurationStep quiz={quiz} setQuiz={setQuiz} errors={errors} navigate={navigate} />;
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créateur de Quiz</h1>
          <p className="text-gray-600">Créez vos quiz facilement ou utilisez l'IA</p>
        </div>
        <StepIndicator />
        <div className="min-h-[600px]">
          {renderStep()}
        </div>
        {currentStep < 3 && <NavigationButtons />}
      </div>
    </div>
  );
};

export default AddQuizPage;