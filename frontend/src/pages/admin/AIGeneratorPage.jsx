import React, { useState } from 'react';
import { Sparkles, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const AIGeneratorPage = ({ 
  setQuestions = () => {}, 
  setQuiz = () => {}, 
  setCurrentStep = () => {} 
}) => {
  const navigate = useNavigate();
  const [aiGenerating, setAiGenerating] = useState(false);
  const [errors, setErrors] = useState({});
  const [aiPrompt, setAiPrompt] = useState({
    title: '',
    subject: '',
    topic: '',
    niveau: '',
    difficulty: 'medium',
    questionCount: 10,
    questionTypes: ['single_choice'], // Changed from 'multiple_choice' to 'single_choice'
    instructions: ''
  });

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
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Moyen' },
    { value: 'hard', label: 'Difficile' }
  ];

  // Updated question types to match backend expectations
  const questionTypes = [
    { value: 'single_choice', label: 'Choix Unique', description: '4 options, 1 seule bonne réponse' },
    { value: 'multiple_choice', label: 'Choix Multiples', description: '4 options, plusieurs bonnes réponses' },
    { value: 'true_false', label: 'Vrai/Faux', description: 'Affirmation à évaluer' }
  ];

  const subjects = [
    'Mathématiques', 'Physique', 'Chimie', 'SVT', 'Histoire', 
    'Géographie', 'Français', 'Anglais', 'Philosophie', 'Informatique'
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!aiPrompt.title) newErrors.title = 'Le titre est requis.';
    if (!aiPrompt.subject) newErrors.subject = 'Le sujet est requis.';
    if (!aiPrompt.topic) newErrors.topic = 'Le thème est requis.';
    if (!aiPrompt.niveau) newErrors.niveau = 'Le niveau scolaire est requis.';
    if (!aiPrompt.questionTypes || aiPrompt.questionTypes.length === 0) {
      newErrors.questionTypes = 'Au moins un type de question doit être sélectionné.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleQuestionTypeChange = (typeValue, checked) => {
    let updated;
    if (checked) {
      updated = [...aiPrompt.questionTypes, typeValue];
    } else {
      updated = aiPrompt.questionTypes.filter(t => t !== typeValue);
    }
    setAiPrompt({ ...aiPrompt, questionTypes: updated });
  };

  const generateWithAI = async () => {
    if (!validateForm()) return;
    setAiGenerating(true);
    setErrors({});

    try {
      console.log('Sending request with question types:', aiPrompt.questionTypes);
      
      const response = await api.post('/quizzes/generate', {
        title: aiPrompt.title,
        subject: aiPrompt.subject,
        numberOfQuestions: aiPrompt.questionCount,
        difficulty: aiPrompt.difficulty,
        instructions: aiPrompt.instructions,
        niveau: aiPrompt.niveau,
        topic: aiPrompt.topic,
        questionTypes: aiPrompt.questionTypes // This now sends the correct types
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000 
      });

      const data = response.data;
     
      
      if (!data || data.success === false) {
        const errorMessage = data?.error || 'Une erreur inattendue est survenue.';
        setErrors({ server: errorMessage });
        return;
      }

      // Check if we have a valid ID in the response
      const quizId = data.id || data.quizId || data.quiz?.id;
      
      if (!quizId) {
        console.error('Aucun ID trouvé dans la réponse:', data);
        setErrors({ server: "Le serveur n'a pas retourné d'ID pour le quiz généré." });
        return;
      }

      // Generate mock questions based on the selected types
      const mockQuestions = generateMockQuestions();

      const formattedQuiz = {
        id: quizId,
        title: data.title || aiPrompt.title,
        subject: aiPrompt.subject,
        niveau: aiPrompt.niveau,
        difficulty: aiPrompt.difficulty.toUpperCase(),
        timeLimit: aiPrompt.questionCount * 2,
        isAIGenerated: true,
        createdAt: new Date().toISOString(),
        questions: mockQuestions
      };

      setQuiz(formattedQuiz);
      setQuestions(formattedQuiz.questions);
    
      if (formattedQuiz.id) {
        const finalQuizId = parseInt(formattedQuiz.id);
      
        
        if (isNaN(finalQuizId) || finalQuizId <= 0) {
          console.error('ID du quiz invalide après parsing:', formattedQuiz.id);
          setErrors({ server: `L'ID du quiz généré est invalide: ${formattedQuiz.id}` });
          return;
        }
        
        const navigationUrl = `/admin/quiz-preview/${finalQuizId}`;
        console.log('Navigating to:', navigationUrl);
        navigate(navigationUrl);
      } else {
        console.error('Aucun ID dans formattedQuiz:', formattedQuiz);
        setErrors({ server: "Le quiz a été créé mais son ID est manquant dans la réponse formatée." });
      }

    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      let errorMessage = 'Une erreur inconnue est survenue.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'La génération a pris trop de temps.';
      } else if (error.response) {
        console.error('Détails de l\'erreur:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        errorMessage = error.response.data?.error || `Erreur serveur ${error.response.status}.`;
      } else if (error.request) {
        errorMessage = 'Aucune réponse du serveur.';
      } else {
        errorMessage = error.message;
      }
      setErrors({ server: errorMessage });
    } finally {
      setAiGenerating(false);
    }
  };

  const generateMockQuestions = () => {
    const questions = [];
    const types = aiPrompt.questionTypes;
    
    for (let i = 0; i < aiPrompt.questionCount; i++) {
      const randomType = types[i % types.length];
      
      if (randomType === 'single_choice') {
        questions.push({
          id: i + 1,
          questionText: `Question ${i + 1} - Choix unique sur ${aiPrompt.topic}`,
          type: 'single_choice',
          points: 1,
          questionOrder: i + 1,
          explanation: `Explication pour la question ${i + 1}`,
          answers: [
            { id: `${i+1}-1`, answerText: 'Option A', isCorrect: i % 4 === 0 },
            { id: `${i+1}-2`, answerText: 'Option B', isCorrect: i % 4 === 1 },
            { id: `${i+1}-3`, answerText: 'Option C', isCorrect: i % 4 === 2 },
            { id: `${i+1}-4`, answerText: 'Option D', isCorrect: i % 4 === 3 }
          ]
        });
      } else if (randomType === 'multiple_choice') {
        const correctIndices = [0, 2]; 
        questions.push({
          id: i + 1,
          questionText: `Question ${i + 1} - Choix multiples sur ${aiPrompt.topic}`,
          type: 'multiple_choice',
          points: 1,
          questionOrder: i + 1,
          explanation: `Explication pour la question à choix multiples ${i + 1}`,
          answers: [
            { id: `${i+1}-1`, answerText: 'Option A', isCorrect: correctIndices.includes(0) },
            { id: `${i+1}-2`, answerText: 'Option B', isCorrect: correctIndices.includes(1) },
            { id: `${i+1}-3`, answerText: 'Option C', isCorrect: correctIndices.includes(2) },
            { id: `${i+1}-4`, answerText: 'Option D', isCorrect: correctIndices.includes(3) }
          ]
        });
      } else if (randomType === 'true_false') {
        questions.push({
          id: i + 1,
          questionText: `Question ${i + 1} - Affirmation sur ${aiPrompt.topic}`,
          type: 'true_false',
          points: 1,
          questionOrder: i + 1,
          explanation: `Explication pour la question vrai/faux ${i + 1}`,
          answers: [
            { id: `${i+1}-1`, answerText: 'Vrai', isCorrect: i % 2 === 0 },
            { id: `${i+1}-2`, answerText: 'Faux', isCorrect: i % 2 === 1 }
          ]
        });
      }
    }
    
    return questions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à la création manuelle
        </button>
        
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">
          Générateur de Quiz par IA
        </h1>
        
        {errors.server && (
          <div className="flex items-center bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{errors.server}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="text-sm font-medium text-gray-700">Titre du quiz *</label>
            <input
              id="title"
              type="text"
              value={aiPrompt.title}
              onChange={(e) => setAiPrompt({ ...aiPrompt, title: e.target.value })}
              className={`mt-1 w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: Quiz sur les forces et le mouvement"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && <p id="title-error" className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="text-sm font-medium text-gray-700">Sujet *</label>
            <select
              id="subject"
              value={aiPrompt.subject}
              onChange={(e) => setAiPrompt({ ...aiPrompt, subject: e.target.value })}
              className={`mt-1 w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? "subject-error" : undefined}
            >
              <option value="">-- Choisir un sujet --</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            {errors.subject && <p id="subject-error" className="text-red-500 text-sm mt-1">{errors.subject}</p>}
          </div>

          {/* Topic */}
          <div>
            <label htmlFor="topic" className="text-sm font-medium text-gray-700">Thème *</label>
            <input
              id="topic"
              type="text"
              value={aiPrompt.topic}
              onChange={(e) => setAiPrompt({ ...aiPrompt, topic: e.target.value })}
              className={`mt-1 w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.topic ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: La révolution industrielle"
              aria-invalid={!!errors.topic}
              aria-describedby={errors.topic ? "topic-error" : undefined}
            />
            {errors.topic && <p id="topic-error" className="text-red-500 text-sm mt-1">{errors.topic}</p>}
          </div>

          {/* Level */}
          <div>
            <label htmlFor="niveau" className="text-sm font-medium text-gray-700">Niveau scolaire *</label>
            <select
              id="niveau"
              value={aiPrompt.niveau}
              onChange={(e) => setAiPrompt({ ...aiPrompt, niveau: e.target.value })}
              className={`mt-1 w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.niveau ? 'border-red-500' : 'border-gray-300'}`}
              aria-invalid={!!errors.niveau}
              aria-describedby={errors.niveau ? "niveau-error" : undefined}
            >
              <option value="">-- Sélectionnez un niveau --</option>
              {niveaux.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {errors.niveau && <p id="niveau-error" className="text-red-500 text-sm mt-1">{errors.niveau}</p>}
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="difficulty" className="text-sm font-medium text-gray-700">Difficulté</label>
            <select
              id="difficulty"
              value={aiPrompt.difficulty}
              onChange={(e) => setAiPrompt({ ...aiPrompt, difficulty: e.target.value })}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
              ))}
            </select>
          </div>

          {/* Question count */}
          <div>
            <label htmlFor="questionCount" className="text-sm font-medium text-gray-700">Nombre de questions (1–30)</label>
            <input
              id="questionCount"
              type="number"
              value={aiPrompt.questionCount}
              onChange={(e) => setAiPrompt({ ...aiPrompt, questionCount: parseInt(e.target.value) })}
              min="1"
              max="30"
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Question types */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-3 block">Types de questions *</label>
            {errors.questionTypes && <p className="text-red-500 text-sm mb-2">{errors.questionTypes}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {questionTypes.map((type) => (
                <div key={type.value} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiPrompt.questionTypes.includes(type.value)}
                      onChange={(e) => handleQuestionTypeChange(type.value, e.target.checked)}
                      className="mt-1 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <label htmlFor="instructions" className="text-sm font-medium text-gray-700 mb-1 block">
              Instructions supplémentaires
            </label>
            <textarea
              id="instructions"
              value={aiPrompt.instructions}
              onChange={(e) => setAiPrompt({ ...aiPrompt, instructions: e.target.value })}
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Ajoutez des instructions ou contraintes spécifiques pour la génération..."
            />
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={generateWithAI}
            disabled={!aiPrompt.title || !aiPrompt.subject || !aiPrompt.topic || !aiPrompt.niveau || aiGenerating || aiPrompt.questionTypes.length === 0}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Générer le Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratorPage;