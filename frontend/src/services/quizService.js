import api from '../api/axios';
import { authService } from './authService'; 

const quizTakingService = {
  baseURL: 'http://localhost:8080/api',
  
  getCurrentUserId() {
    const currentUser = authService.getCurrentUser();
  
    if (currentUser && currentUser.id) {
      return currentUser.id.toString(); 
    }
    throw new Error('AuthenticatedUserNotFound');
  },
  async getQuizById(id) {
    try {
      const response = await api.get(`/quizzes/${id}`, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      return response.data;
      
    } catch (error) {
      console.error(' Erreur lors de la récupération du quiz:', error);
    }
  },
  // Récupérer les questions d'un quiz avec leurs réponses
  async getQuestionsByQuizId(quizId) {
    try {
      const response = await api.get(`/questions/quiz/${quizId}`, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const questions = response.data;
  
      const formattedQuestions = await Promise.all(
        questions.map(async (question) => {
          try {
   
            const answersResponse = await api.get(`/answers/question/${question.id}`);
            const answers = answersResponse.data || [];

            const correctAnswerIndices = answers
            .map((answer, index) => answer.isCorrect ? index : -1)
            .filter(index => index !== -1);
            
           return {
            id: question.id,
            questionText: question.questionText,
            options: answers.map(answer => answer.answerText),
            correctAnswer: correctAnswerIndices[0] || 0, // Pour compatibilité
            correctAnswers: correctAnswerIndices, // NOUVEAU: toutes les réponses correctes
            correctAnswerText: answers.find(answer => answer.isCorrect)?.answerText,
            points: question.points || 1,
            explanation: question.explanation,
            // NOUVEAU: Ajouter directement les objets answers
            answers: answers.map((answer, index) => ({
              id: answer.id,
              answerText: answer.answerText,
              isCorrect: answer.isCorrect
            }))
          };
          } catch (answerError) {
            console.error(`Erreur lors de la récupération des réponses pour la question ${question.id}:`, answerError);
            return {
              id: question.id,
              questionText: question.questionText,
              options: [],
              correctAnswer: -1,
              correctAnswerText: '',
              points: question.points || 1,
              explanation: question.explanation
            };
          }
        })
      );
      return formattedQuestions;
      
    } catch (error) {
      console.warn(`Impossible de récupérer les questions pour le quiz ${quizId}:`, error);
    }
  },

  async submitQuizResult(quizId, answers, timeSpent) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('User ID is required');

      const correctCount = Object.keys(answers).reduce((count, questionId) => {
        const question = questions.find(q => q.id === parseInt(questionId));
        return question && answers[questionId] === question.options[question.correctAnswer] 
          ? count + 1 
          : count;
      }, 0);
  
      const resultData = {
        score: correctCount,
        total: questions.length,
        percentage: (correctCount / questions.length) * 100,
        takenAt: new Date().toISOString(),
        timeSpent: timeSpent
      };
  
      console.log('📤 Submitting to correct endpoint /api/results');
      const response = await api.post(`/results/user/${userId}/quiz/${quizId}`, resultData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
  
      return {
        ...response.data,
        _isSaved: true,
        correctAnswers: correctCount,
        totalQuestions: questions.length
      };
  
    } catch (error) {
 
    }
  },

  getCurrentUserId() {

    let userId = localStorage.getItem('userId') || 
                 sessionStorage.getItem('userId') || 
                 localStorage.getItem('user_id') ||
                 sessionStorage.getItem('user_id');
    
    if (userId && !isNaN(parseInt(userId)) && parseInt(userId) > 0) {
      return parseInt(userId);
    }
    
    const defaultUserId = 1;
    localStorage.setItem('userId', defaultUserId.toString());
    return defaultUserId;
  }
};

// ===== FONCTIONS CRUD POUR LES QUIZ =====

// Créer un nouveau quiz
export const createQuiz = async (quizData, creatorId) => {
  try {  
    const config = {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
  
    };

    const response = await api.post(`/quizzes/creator/${creatorId}`, quizData, config);

    if (response.data && typeof response.data === 'object') {
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Erreur retournée par le serveur');
      }

      if (response.data.success === true) {
        return response.data;
      }
      if (response.data.id) {
        return response.data;
      }
    }
    throw new Error('Structure de réponse inattendue du serveur');

  } catch (error) {
    console.error('Erreur createQuiz:', error);
    
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      let errorMessage;
      if (errorData && typeof errorData === 'object') {
        errorMessage = errorData.message || errorData.error || `Erreur ${status}`;
      } else {
        errorMessage = `Erreur ${status}: ${error.response.statusText}`;
      }
      
      throw new Error(errorMessage);
      
    } else if (error.request) {
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Erreur réseau. Vérifiez que le serveur backend est démarré sur http://localhost:8080');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout de la requête. Le serveur met trop de temps à répondre.');
      } else {
        throw new Error('Aucune réponse du serveur. Vérifiez votre connexion.');
      }
    } else {
      throw new Error('Erreur lors de la configuration de la requête: ' + error.message);
    }
  }
};


export const createQuestions = async (quizId, questions) => {
  try {
    if (!questions || questions.length === 0) {
      throw new Error('Aucune question à créer');
    }

    const invalidQuestions = questions.filter((q, index) => {
      if (!q.questionText || !q.questionText.trim()) {
        console.error(`Question ${index + 1}: Texte manquant`);
        return true;
      }
      if (!q.answers || q.answers.length === 0) {
        console.error(`Question ${index + 1}: Aucune réponse`);
        return true;
      }
      return false;
    });

    if (invalidQuestions.length > 0) {
      throw new Error(`${invalidQuestions.length} question(s) invalide(s) détectée(s)`);
    }

    const config = {
      timeout: 45000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const response = await api.post(`/questions/batch/${quizId}`, questions, config);
    return response.data;

  } catch (error) {
    console.error(' Erreur createQuestions:', error);
    
    if (error.response) {
      const errorData = error.response.data;
      const message = errorData?.message || errorData?.error || 'Erreur lors de la création des questions';
      throw new Error(message);
    } else if (error.request) {
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Erreur réseau lors de la création des questions');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout lors de la création des questions');
      } else {
        throw new Error('Pas de réponse du serveur pour les questions');
      }
    } else {
      throw new Error('Erreur de configuration pour les questions: ' + error.message);
    }
  }
};

// Récupérer tous les quiz avec le nombre de questions
export const getAllQuizzes = async () => {
  try {
    const config = {
      timeout: 15000,
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const response = await api.get('/quizzes', config);
    const quizzes = Array.isArray(response.data) ? response.data : [];
    
   
    const quizzesWithQuestionCount = await Promise.allSettled(
      quizzes.map(async (quiz) => {
        try {
          const questionsResponse = await api.get(`/questions/quiz/${quiz.id}`, {
            timeout: 8000,
            headers: { 'Accept': 'application/json' }
          });
          const questions = questionsResponse.data || [];
          
          return {
            ...quiz,
            questions: questions,
            numberOfQuestions: questions.length
          };
        } catch (error) {
          console.warn(`⚠️ Quiz "${quiz.title}" (ID: ${quiz.id}): Impossible de récupérer les questions`);
          return {
            ...quiz,
            questions: [],
            numberOfQuestions: 0
          };
        }
      })
    );
    
    // Filtrer les résultats réussis
    const successfulQuizzes = quizzesWithQuestionCount
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    
    const failedCount = quizzesWithQuestionCount.length - successfulQuizzes.length;
    if (failedCount > 0) {
      console.warn(` ${failedCount} quiz n'ont pas pu récupérer leurs questions`);
    }
    return successfulQuizzes;
    
  } catch (error) {
    console.error(' Erreur getAllQuizzes:', error);
    
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        return [];
      }
      throw new Error(`Erreur ${status}: ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Erreur réseau. Vérifiez que le serveur backend est démarré.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout lors de la récupération des quiz.');
      } else {
        throw new Error('Aucune réponse du serveur lors de la récupération des quiz.');
      }
    } else {
      throw new Error('Erreur lors de la récupération des quiz: ' + error.message);
    }
  }
};

// Récupérer un quiz par ID avec ses questions
export const getQuizById = async (id) => {
  try {
    const config = {
      timeout: 15000,
      headers: {
        'Accept': 'application/json'
      }
    };
    

    const response = await api.get(`/quizzes/${id}`, config);
    const quiz = response.data;
    
   
    try {
      const questionsResponse = await api.get(`/questions/quiz/${id}`, config);
      const questions = questionsResponse.data || [];
      
      console.log(` ${questions.length} questions récupérées pour le quiz "${quiz.title}"`);
      
   
      quiz.questions = questions;
      quiz.numberOfQuestions = questions.length;
      
    } catch (questionsError) {
      console.warn(` Impossible de récupérer les questions pour le quiz ${id}:`, questionsError.message);
      quiz.questions = [];
      quiz.numberOfQuestions = 0;
    }
    
    return quiz;
    
  } catch (error) {
    console.error(` Erreur getQuizById ${id}:`, error);
    
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        throw new Error(`Quiz avec l'ID ${id} non trouvé`);
      }
      throw new Error(`Erreur ${status}: ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Erreur réseau lors de la récupération du quiz');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout lors de la récupération du quiz');
      } else {
        throw new Error('Aucune réponse du serveur pour le quiz');
      }
    } else {
      throw new Error('Erreur lors de la récupération du quiz: ' + error.message);
    }
  }
};

export const getQuizzesByCreator = async (creatorId) => {
  try {  
    const config = {
      timeout: 15000,
      headers: {
        'Accept': 'application/json'
      }
    };
    const response = await api.get(`/quizzes/creator/${creatorId}`, config);
    const quizzes = Array.isArray(response.data) ? response.data : [];
    
    const quizzesWithQuestionCount = await Promise.allSettled(
      quizzes.map(async (quiz) => {
        try {
          const questionsResponse = await api.get(`/questions/quiz/${quiz.id}`, {
            timeout: 5000,
            headers: { 'Accept': 'application/json' }
          });
          const questions = questionsResponse.data || [];
          
          return {
            ...quiz,
            questions: questions,
            numberOfQuestions: questions.length
          };
        } catch (error) {
          return {
            ...quiz,
            questions: [],
            numberOfQuestions: 0
          };
        }
      })
    );
    
    return quizzesWithQuestionCount
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    
  } catch (error) {
    console.error(` Erreur getQuizzesByCreator ${creatorId}:`, error);
    
    if (error.response?.status === 404) {
      return [];
    }
    throw new Error('Erreur lors de la récupération des quiz du créateur');
  }
};

export const deleteQuiz = async (id) => {
  try {
    const response = await api.delete(`/quizzes/${id}`, { timeout: 15000 });
    console.log(` Quiz ${id} supprimé avec succès`);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la suppression du quiz');
  }
};


export const updateQuiz = async (id, quizData) => {
  try {

    const cleanQuizData = {
      title: quizData.title?.trim() || 'Quiz sans titre',
      subject: quizData.subject?.trim() || 'Général',
      niveau: quizData.niveau || 'Débutant',
      difficulty: quizData.difficulty?.toUpperCase() || 'MEDIUM',
      timeLimit: parseInt(quizData.timeLimit) || 30,
      isAIGenerated: Boolean(quizData.isAIGenerated) || false
    };
    
    
    const config = {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    const response = await api.put(`/quizzes/${id}`, cleanQuizData, config);
    
  
    if (response.data && typeof response.data === 'object') {
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Erreur retournée par le serveur');
      }
      
    
      if (response.data.success === true && response.data.data) {
        return response.data.data;
      }
      
    
      return response.data;
    }
    
    return response.data;

  } catch (error) {
    console.error(`Erreur updateQuiz ${id}:`, error);
    
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      console.error('Status:', status);
      console.error('Error data:', errorData);
      
      let errorMessage;
      if (errorData && typeof errorData === 'object') {
        errorMessage = errorData.message || errorData.error || `Erreur HTTP ${status}`;
      } else {
        errorMessage = `Erreur ${status}: ${error.response.statusText}`;
      }
      
      throw new Error(errorMessage);
      
    } else if (error.request) {
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Erreur réseau. Vérifiez que le serveur backend est accessible.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout de la requête. Le serveur met trop de temps à répondre.');
      } else {
        throw new Error('Aucune réponse du serveur. Vérifiez votre connexion.');
      }
    } else {
      throw new Error('Erreur lors de la configuration de la requête: ' + error.message);
    }
  }
};

export const updateQuestion = async (questionId, questionData) => {
  try {    
    const config = {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    const response = await api.put(`/questions/${questionId}`, questionData, config);
    return response.data;
    
  } catch (error) {

    throw new Error('Erreur lors de la mise à jour de la question: ' + error.message);
  }
};


export const deleteQuestion = async (questionId) => {
  try {
    const response = await api.delete(`/questions/${questionId}`, { timeout: 15000 });
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la suppression de la question: ' + error.message);
  }
};

export const updateAnswers = async (questionId, answers) => {
  try {
    console.log(`🔄 Mise à jour des réponses pour la question ${questionId}...`);
    
    const config = {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    const response = await api.put(`/answers/question/${questionId}`, answers, config);
    return response.data;
    
  } catch (error) {
    throw new Error('Erreur lors de la mise à jour des réponses: ' + error.message);
  }
};


export const testConnection = async () => {
  try {
    console.log(' Test de connexion au serveur...');
    const response = await api.get('/quizzes', { timeout: 5000 });
    console.log(' Connexion au serveur réussie');
    return true;
  } catch (error) {
    console.error(' Échec de la connexion au serveur:', error.message);
    return false;
  }
};


// ===== EXPORT DU SERVICE PRINCIPAL =====

const quizService = {
  
  quizTaking: quizTakingService,
  
  // CRUD operations
  createQuiz,
  createQuestions,
  getAllQuizzes,
  getQuizById,
  getQuizzesByCreator,
  deleteQuiz,
  updateQuiz,
  updateAnswers,
  updateQuestion,
  deleteQuestion,
  
  // Utilities
  testConnection
};

export default quizService;