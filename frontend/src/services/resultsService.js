import api from '../api/axios';
import { authService } from './authService'; 

const resultsService = {

  generateUserId() {
    return Date.now(); 
  },

  getCurrentUserId() {
    const currentUser = authService.getCurrentUser();
  
    if (currentUser && currentUser.id) {
      return currentUser.id.toString(); 
    }
    throw new Error('AuthenticatedUserNotFound');
  },

  saveDetailedAnswersToStorage(resultId, detailedAnswers, quizData) {
    try {
      const storageKey = `quiz_details_${resultId}`;
      const dataToStore = {
        resultId: resultId,
        answers: detailedAnswers,
        quizTitle: quizData.title,
        subject: quizData.subject,
        difficulty: quizData.difficulty,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      console.log('Détails du quiz sauvegardés dans localStorage:', dataToStore); // Ajout d'un log
    } catch (error) {
      console.warn('Impossible de sauvegarder les détails dans localStorage:', error);
    }
  },

  getDetailedAnswersFromStorage(resultId) {
    try {
      const storageKey = `quiz_details_${resultId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('Détails du quiz récupérés de localStorage:', parsedData); // Ajout d'un log
        return parsedData;
      }
    } catch (error) {
      console.warn('Impossible de récupérer les détails depuis localStorage:', error);
    }
    
    return null;
  },

  async getResultById(resultId) {
  try {
    if (!resultId || resultId === 'undefined' || resultId === 'null') {
      throw new Error('ID de résultat invalide ou manquant');
    }

    const numericId = parseInt(resultId, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error('ID de résultat doit être un nombre valide');
    }
    
    const response = await api.get(`/results/${numericId}`);
    const basicResult = response.data;

    // CORRECTION: Reconstruction des réponses avec toutes les options correctes
    if (basicResult.questions && Array.isArray(basicResult.questions)) {
      basicResult.questions = basicResult.questions.map(question => {
        // Récupérer TOUTES les réponses correctes pour cette question
        const allCorrectAnswers = [];
        
        if (question.answers && Array.isArray(question.answers)) {
          question.answers.forEach(answer => {
            // CORRECTION PRINCIPALE: Utiliser les bonnes propriétés du DTO
            if (answer.isCorrect === true) {  // AnswerDto.isCorrect (Boolean)
              const answerText = answer.answerText;  // AnswerDto.answerText (String)
              if (answerText && answerText.trim()) {
                allCorrectAnswers.push(answerText.trim());
              }
            }
          });
        }

        // Fallback au cas où les réponses correctes sont définies différemment
        if (allCorrectAnswers.length === 0 && question.correctAnswers && Array.isArray(question.correctAnswers)) {
          allCorrectAnswers.push(...question.correctAnswers);
        } else if (allCorrectAnswers.length === 0 && question.correctAnswer) {
          // Gérer une seule bonne réponse, potentiellement une chaîne à plusieurs valeurs
          if (typeof question.correctAnswer === 'string' && question.correctAnswer.includes(',')) {
            allCorrectAnswers.push(...question.correctAnswer.split(',').map(s => s.trim()).filter(Boolean));
          } else {
            allCorrectAnswers.push(question.correctAnswer);
          }
        }

        // Assigner les réponses multiples
        return {
          ...question,
          correctAnswers: allCorrectAnswers.filter(Boolean), // Tableau de toutes les réponses correctes
          correctAnswer: allCorrectAnswers.length === 1 ? allCorrectAnswers[0] : allCorrectAnswers.join(', '), // Pour compatibilité
          isMultipleChoice: allCorrectAnswers.length > 1,
          options: question.answers ? question.answers.map(a => a.answerText).filter(Boolean) : []  // CORRECTION: answerText du DTO
        };
      });
    }

    // Enrichissement avec les données localStorage
    const detailedData = this.getDetailedAnswersFromStorage(numericId);
    if (detailedData && detailedData.answers) {
      // Reconstruire les réponses détaillées avec les bonnes réponses correctes
      const enrichedAnswers = detailedData.answers.map(answer => {
        const questionId = answer.questionId;
        const correspondingQuestion = basicResult.questions?.find(q => q.id.toString() === questionId);
        
        if (correspondingQuestion && correspondingQuestion.correctAnswers) {
          return {
            ...answer,
            correctAnswers: correspondingQuestion.correctAnswers, // Utiliser les données fraîches de la DB
            correctAnswer: correspondingQuestion.correctAnswer, // Pour compatibilité
            isMultipleChoice: correspondingQuestion.isMultipleChoice,
            options: correspondingQuestion.options || [] // Assurez-vous que les options sont là
          };
        }
        
        return answer;
      });

      const enrichedResult = {
        ...basicResult,
        answers: enrichedAnswers,
        quizTitle: detailedData.quizTitle || basicResult.quizTitle || 'Quiz',
        subject: detailedData.subject || basicResult.subject || 'Général',
        difficulty: detailedData.difficulty || basicResult.difficulty || 'MEDIUM'
      };

      console.log('Résultat enrichi avec localStorage:', enrichedResult);
      return enrichedResult;
    } else {
      console.warn("Aucune réponse détaillée trouvée dans localStorage pour ce résultat. Utilisation des données de base.");
      
      // Même sans localStorage, reconstruire les réponses depuis les données de base
      if (basicResult.questions) {
        basicResult.answers = basicResult.questions.map((question, index) => ({
          questionId: question.id.toString(),
          question: question.questionText || question.text,
          selectedAnswer: "Non disponible", // Pas de donnée utilisateur sans localStorage
          correctAnswers: question.correctAnswers || [],
          correctAnswer: question.correctAnswer || "",
          isCorrect: false, // On ne peut pas savoir sans la réponse utilisateur
          isMultipleChoice: question.isMultipleChoice || false,
          explanation: question.explanation || null,
          options: question.options || []
        }));
      }
      
      console.log('Résultat basé uniquement sur l\'API:', basicResult);
      return basicResult;
    }
  } catch (error) {
    console.error('Erreur dans getResultById:', error);
    throw error;
  }
},

  async createResult(resultData, userId, quizId) {
    try {
      const requestBody = {
        score: parseInt(resultData.score) || 0,
        total: parseInt(resultData.total) || 0,
        percentage: parseFloat(resultData.percentage) || 0
      };
      
      const url = `/results/user/${userId}/quiz/${quizId}`;

      const response = await api.post(url, requestBody, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Résultat créé sur le serveur:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Erreur lors de la création du résultat:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        console.error('Détails de l\'erreur serveur:', errorData);
        
        if (error.response.status === 400) {
          throw new Error(`Données invalides: ${errorData.message || errorData.details || 'Vérifiez les données envoyées'}`);
        } else if (error.response.status === 404) {
          throw new Error(`Ressource non trouvée: ${errorData.message || 'Utilisateur ou Quiz introuvable'}`);
        } else if (error.response.status === 500) {
          throw new Error(`Erreur serveur: ${errorData.message || errorData.details || 'Erreur interne du serveur'}`);
        }
        
        throw new Error(errorData.message || `Erreur du serveur: ${error.response.status}`);
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout: Le serveur met trop de temps à répondre');
      }
      
      throw new Error('Impossible de créer le résultat. Vérifiez votre connexion réseau.');
    }
  },

  // FONCTION CORRIGÉE : Trouve toutes les réponses correctes (gère les choix multiples)
 // FONCTION CORRIGÉE : Trouve toutes les réponses correctes (gère les choix multiples)
findCorrectAnswers(question) {
  if (!question) return [];

  let correctAnswers = [];

  // Cas 1: question.answers est un tableau avec des objets du DTO
  if (question.answers && Array.isArray(question.answers)) {
    correctAnswers = question.answers
      .filter(answer => answer.isCorrect === true) // AnswerDto.isCorrect (Boolean)
      .map(answer => answer.answerText)            // AnswerDto.answerText (String)
      .filter(text => text && text.trim() !== '');
  }

  // Cas 2: question.options avec question.correctAnswer(s) si rien trouvé via question.answers
  if (correctAnswers.length === 0 && question.options && Array.isArray(question.options)) {
    if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
      console.log('Traitement des correctAnswers multiples via options:', question.correctAnswers);
      
      correctAnswers = question.correctAnswers.map(answer => {
        // Si c'est un index numérique
        const index = parseInt(answer, 10);
        if (!isNaN(index) && index >= 0 && index < question.options.length) {
          return question.options[index];
        }
        // Si c'est déjà du texte
        return answer;
      }).filter(answer => answer && answer.trim() !== '');
      
    } else if (question.correctAnswer !== undefined) {
      // Une seule réponse correcte
      const index = parseInt(question.correctAnswer, 10);
      if (!isNaN(index) && index >= 0 && index < question.options.length) {
        correctAnswers = [question.options[index]];
      } else if (typeof question.correctAnswer === 'string' && question.options.includes(question.correctAnswer)) {
        correctAnswers = [question.correctAnswer];
      } else if (typeof question.correctAnswer === 'string' && question.correctAnswer.includes(',')) { // Gérer chaîne CSV
        correctAnswers = question.correctAnswer.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }

  // Cas 3: Réponse correcte directe (dernière tentative)
  if (correctAnswers.length === 0 && question.correctAnswerText) {
    // Gérer les réponses multiples séparées par des virgules
    if (question.correctAnswerText.includes(',')) {
      correctAnswers = question.correctAnswerText.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } else {
      correctAnswers = [question.correctAnswerText];
    }
  }

  // Assurez-vous que toutes les réponses sont des chaînes de caractères non vides
  correctAnswers = correctAnswers.map(ans => String(ans)).filter(ans => ans.trim() !== '');

  if (correctAnswers.length === 0) {
    console.warn('Impossible de déterminer les bonnes réponses pour la question:', question.id || question.questionText || question);
  }

  return [...new Set(correctAnswers)]; // Supprimer les doublons
},

  // FONCTION DE COMPATIBILITÉ : Garde l'ancienne interface mais utilise la nouvelle logique
  findCorrectAnswer(question) {
    const correctAnswers = this.findCorrectAnswers(question);
    if (correctAnswers.length === 1) {
      return correctAnswers[0];
    } else if (correctAnswers.length > 1) {
      // Pour les choix multiples, retourner une chaîne séparée par des virgules
      return correctAnswers.join(', ');
    }
    return null;
  },

  // FONCTION CORRIGÉE : Vérifie si une réponse utilisateur est correcte
  isAnswerCorrect(selectedAnswer, correctAnswers, isMultipleChoice = false) {
    if (!selectedAnswer || !correctAnswers || correctAnswers.length === 0) {
      return false;
    }

    // Normaliser la réponse sélectionnée
    const normalizeAnswer = (ans) => {
      if (Array.isArray(ans)) {
        return ans.map(a => String(a).toLowerCase().trim()).filter(Boolean);
      }
      if (typeof ans === 'string') {
        // Gérer les chaînes qui peuvent contenir plusieurs réponses (ex: "oui, non")
        if (ans.includes(',') || ans.includes(';') || ans.includes('|')) {
          return ans.split(/[,;|]/).map(s => String(s).toLowerCase().trim()).filter(Boolean);
        }
        return [String(ans).toLowerCase().trim()].filter(Boolean);
      }
      return [];
    };

    const selectedNormalized = normalizeAnswer(selectedAnswer);
    const correctNormalized = correctAnswers.map(ans => String(ans).toLowerCase().trim()).filter(Boolean);

    // Si aucune réponse correcte n'est définie ou sélectionnée, ce n'est pas correct.
    if (selectedNormalized.length === 0 || correctNormalized.length === 0) {
      return false;
    }

    // Déterminer si c'est un choix multiple basé sur les réponses correctes
    // C'est important si `isMultipleChoice` n'est pas passé ou est incorrect.
    const isActuallyMultipleChoice = correctNormalized.length > 1;

    if (isMultipleChoice || isActuallyMultipleChoice) {
      // Pour les choix multiples, toutes les réponses correctes doivent être sélectionnées
      // et AUCUNE réponse incorrecte ne doit être sélectionnée.
      // Le nombre de réponses sélectionnées doit être exactement le même que le nombre de réponses correctes.
      return correctNormalized.every(correct => selectedNormalized.includes(correct)) &&
             selectedNormalized.every(selected => correctNormalized.includes(selected)) &&
             selectedNormalized.length === correctNormalized.length;
    } else {
      // Pour les choix uniques
      // Une seule réponse sélectionnée, et elle doit être dans les réponses correctes
      return selectedNormalized.length === 1 && correctNormalized.includes(selectedNormalized[0]);
    }
  },

  // Fonction corrigée pour submitQuizResult
  async submitQuizResult(quizId, answers, timeSpent, questions) {
    const userId = this.getCurrentUserId();

    let correctCount = 0;
    const detailedResults = [];
    
    Object.entries(answers).forEach(([questionId, selectedAnswer]) => {
      const question = questions.find(q => q.id.toString() === questionId);
      if (!question) {
        console.warn(`Question non trouvée pour l'ID: ${questionId}`);
        return;
      }
      
      // UTILISATION DE LA NOUVELLE LOGIQUE pour récupérer TOUTES les réponses correctes
      const correctAnswers = this.findCorrectAnswers(question);
      const isMultipleChoice = correctAnswers.length > 1; // Déduit si c'est multiple
      const isCorrect = this.isAnswerCorrect(selectedAnswer, correctAnswers, isMultipleChoice);
      
      if (isCorrect) {
        correctCount++;
      }
      
      // CORRECTION: S'assurer que correctAnswers est toujours un tableau complet
      const correctAnswersArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers].filter(Boolean);

      // CORRECTION: Normaliser selectedAnswer pour la sauvegarde
      const normalizeSelectedAnswerForSave = (answer) => {
        if (!answer) return [];
        if (Array.isArray(answer)) return answer.map(String).filter(Boolean);
        if (typeof answer === 'string') {
          if (answer.includes(',') || answer.includes(';') || answer.includes('|')) {
            return answer.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
          }
          return [answer];
        }
        return [];
      };

      const selectedAnswerArray = normalizeSelectedAnswerForSave(selectedAnswer);

      // LOGGING pour debug
      console.log(`Question ${questionId} - Sauvegarde:`, {
        question: question.questionText || question.text,
        selectedAnswerRaw: selectedAnswer, // La réponse brute telle que reçue
        selectedAnswerArray,
        correctAnswersArray,
        isMultipleChoice,
        isCorrect,
        rawQuestion: question // Pour voir la structure complète de la question
      });
    
      detailedResults.push({
        questionId: questionId,
        question: question.questionText || question.text,
        selectedAnswer: selectedAnswerArray.length === 1 ? selectedAnswerArray[0] : selectedAnswerArray, // Pour l'affichage
        correctAnswer: correctAnswersArray.join(', '), // String pour compatibilité legacy
        correctAnswers: correctAnswersArray, // TABLEAU COMPLET - C'est le plus important !
        isCorrect: isCorrect,
        isMultipleChoice: isMultipleChoice,
        explanation: question.explanation || null,
        options: question.options || []
      });
    });
    
    const percentage = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

    const resultData = {
      score: correctCount,
      total: questions.length,
      percentage: Math.round(percentage * 100) / 100,
    };

    try {
      let serverResult;
      try {
        serverResult = await this.createResult(resultData, userId, quizId);
      } catch (primaryError) {
        console.warn('Méthode principale échouée, essai avec la méthode simple (si elle existe):', primaryError.message);
        // Assurez-vous d'avoir une méthode createResultSimple ou supprimez cette partie si non nécessaire
        // serverResult = await this.createResultSimple(resultData, userId, quizId); 
        throw primaryError; // Relance l'erreur si la simple n'existe pas ou ne marche pas
      }
      
      const resultId = serverResult.id || serverResult.resultId;
      if (!resultId) {
        console.error('Aucun ID retourné par le serveur:', serverResult);
        throw new Error('ID de résultat manquant dans la réponse du serveur');
      }

      const quizData = questions[0] ? {
        title: questions[0].quizTitle || `Quiz ${quizId}`, 
        subject: questions[0].subject || 'Général', 
        difficulty: questions[0].difficulty || 'MEDIUM' 
      } : {
        title: `Quiz ${quizId}`, 
        subject: 'Général', 
        difficulty: 'MEDIUM' 
      };
      
      // CORRECTION: Logging de la sauvegarde pour vérifier
      console.log('🔄 Sauvegarde localStorage avec détails complets:', {
        resultId,
        detailedResults: detailedResults.map(r => ({
          questionId: r.questionId,
          correctAnswers: r.correctAnswers,
          isMultipleChoice: r.isMultipleChoice,
          selectedAnswer: r.selectedAnswer
        }))
      });
      
      this.saveDetailedAnswersToStorage(resultId, detailedResults, quizData);
            
      return {
        resultId: resultId,
        id: resultId,
        quizId: parseInt(quizId),
        userId: userId,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        timeSpent: timeSpent,
        percentage: Math.round(percentage),
        score: Math.round(percentage),
        submittedAt: serverResult.takenAt || new Date().toISOString(),
        detailedResults: detailedResults,
        _isSaved: true,
        _isLocal: false,
      };

    } catch (saveError) {
      console.warn('Impossible de sauvegarder sur le serveur:', saveError.message);
      
      const localId = Date.now();
      this.saveDetailedAnswersToStorage(localId, detailedResults, {
        title: `Quiz ${quizId}`,
        subject: 'Général',
        difficulty: 'MEDIUM'
      });

      return {
        id: localId,
        resultId: localId,
        quizId: parseInt(quizId),
        userId: userId,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        timeSpent: timeSpent,
        percentage: Math.round(percentage),
        score: Math.round(percentage),
        submittedAt: new Date().toISOString(),
        detailedResults: detailedResults,
        _isLocal: true,
        _isSaved: false,
        _saveError: saveError.message
      };
    }
  },

  // Méthodes pour la page des résultats
  async getUserResults(userId) {
    try {
      if (!userId) {
        console.warn('Tentative de chargement des résultats sans userId.');
        return []; 
      }
      const response = await api.get(`/results/user/${userId}`);
      console.log('Résultats utilisateur récupérés:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des résultats pour l'utilisateur ${userId}:`, error);

      if (error.response?.status === 404) {
        return [];
      }
      throw error; 
    }
  },

  calculateUserStats(results) {
    if (!results || results.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        subjectAverages: []
      };
    }

    const totalQuizzes = results.length;
    const averageScore = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalQuizzes;
    const bestScore = Math.max(...results.map(r => r.percentage || 0));
    const totalQuestions = results.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalCorrect = results.reduce((sum, r) => sum + (r.score || 0), 0);
    
    const subjectStats = {};
    results.forEach(result => {
      const subject = result.quiz?.subject || 'Non classé';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { count: 0, totalScore: 0, totalQuestions: 0, totalCorrect: 0 };
      }
      subjectStats[subject].count++;
      subjectStats[subject].totalScore += (result.percentage || 0);
      subjectStats[subject].totalQuestions += (result.total || 0);
      subjectStats[subject].totalCorrect += (result.score || 0);
    });

    const subjectAverages = Object.keys(subjectStats).map(subject => ({
      subject,
      average: subjectStats[subject].totalScore / subjectStats[subject].count,
      count: subjectStats[subject].count,
      totalQuestions: subjectStats[subject].totalQuestions,
      totalCorrect: subjectStats[subject].totalCorrect
    }));

    return {
      totalQuizzes,
      averageScore: Math.round(averageScore * 10) / 10,
      bestScore: Math.round(bestScore * 10) / 10,
      totalQuestions,
      totalCorrect,
      subjectAverages
    };
  },

  searchResults(results, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return results;
    }

    const term = searchTerm.toLowerCase();
    return results.filter(result => 
      (result.quiz?.title?.toLowerCase().includes(term) ||
       result.quiz?.subject?.toLowerCase().includes(term) ||
       result.quiz?.difficulty?.toLowerCase().includes(term))
    );
  },

  sortResults(results, sortBy) {
    if (!results || results.length === 0) {
      return [];
    }

    const sorted = [...results];
    
    switch(sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.takenAt || 0) - new Date(a.takenAt || 0));
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.takenAt || 0) - new Date(b.takenAt || 0));
      case 'score-desc':
        return sorted.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
      case 'score-asc':
        return sorted.sort((a, b) => (a.percentage || 0) - (b.percentage || 0));
      case 'title-asc':
        return sorted.sort((a, b) => (a.quiz?.title || '').localeCompare(b.quiz?.title || ''));
      case 'title-desc':
        return sorted.sort((a, b) => (b.quiz?.title || '').localeCompare(a.quiz?.title || ''));
      case 'subject-asc':
        return sorted.sort((a, b) => (a.quiz?.subject || '').localeCompare(b.quiz?.subject || ''));
      default:
        return sorted;
    }
  },

  async testConnection() {
    try {
      const response = await api.get('/results', { 
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      return true;
    } catch (error) {
      return false;
    }
  }
};

export default resultsService;