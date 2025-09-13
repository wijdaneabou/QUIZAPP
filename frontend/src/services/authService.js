import axios from '../api/axios';

export const authService = {

  register: async (userData) => {
    try {
      // Préparer les données à envoyer au backend
      const registrationData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role
      };

      // ✅ MODIFICATION : Ajouter le niveau pour tous les étudiants (role USER)
      if (userData.level && userData.role === 'USER') {
        registrationData.niveau = userData.level; // Backend attend 'niveau'
      }

      const response = await axios.post('/auth/register', registrationData);
      
      const { token, user } = response.data;
      
      // Stocker le token et les informations utilisateur
      localStorage.setItem('token', token);
      
      // ✅ MODIFICATION : Stocker les informations utilisateur avec le niveau du backend
      const userToStore = {
        ...user,
        level: user.niveau || userData.level || null // Mapper 'niveau' vers 'level' pour le frontend
      };
      
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      // Stocker spécifiquement le niveau pour un accès facile
      if (user.niveau && userData.role === 'USER') {
        localStorage.setItem('userLevel', user.niveau);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data || 'Erreur lors de l\'inscription');
    }
  },

  login: async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });

      const { token, user } = response.data;

      // ✅ MODIFICATION : Mapper le niveau du backend vers le frontend
      const userToStore = {
        ...user,
        level: user.niveau || null // Mapper 'niveau' vers 'level'
      };

      // Stocker le token et les informations utilisateur
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userToStore));

      // Si l'utilisateur a un niveau, le stocker séparément
      if (user.niveau) {
        localStorage.setItem('userLevel', user.niveau);
      }

      return token;
    } catch (error) {
      throw new Error(error.response?.data || 'Erreur lors de la connexion');
    }
  },

  // Connexion/Inscription Google
  loginWithGoogle: async (idToken) => {
    try {
      const response = await axios.post('/auth/google', {
        token: idToken
      });
      
      const { token, user } = response.data;
      
      // ✅ MODIFICATION : Gérer la réponse mise à jour du backend
      const userToStore = {
        email: user.email,
        name: user.name,
        role: user.role || 'USER',
        level: user.niveau || null, // Mapper 'niveau' vers 'level'
        id: user.id
      };
      
      // Stocker le token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      // Stocker le niveau si disponible
      if (user.niveau) {
        localStorage.setItem('userLevel', user.niveau);
      }
      
      return token;
    } catch (error) {
      throw new Error(error.response?.data || 'Erreur lors de la connexion Google');
    }
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userLevel');
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = parseJwt(token);
      return payload.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  },

  // Récupérer l'utilisateur actuel
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Récupérer le niveau de l'utilisateur actuel
  getCurrentUserLevel: () => {
    return localStorage.getItem('userLevel');
  },

  // ✅ MODIFICATION : Mettre à jour le niveau de l'utilisateur avec le bon endpoint
  updateUserLevel: async (newLevel) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      const response = await axios.put('/auth/update-niveau', { 
        email: currentUser.email,
        niveau: newLevel 
      });
      
      // Mettre à jour le localStorage
      localStorage.setItem('userLevel', newLevel);
      
      // Mettre à jour aussi les informations utilisateur
      if (currentUser) {
        currentUser.level = newLevel;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data || 'Erreur lors de la mise à jour du niveau');
    }
  },

  // Vérifier si l'utilisateur est un étudiant
  isStudent: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'USER';
  },

  // Vérifier si l'utilisateur est un enseignant/admin
  isTeacher: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'ADMIN';
  },

  // Récupérer le token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // ✅ AMÉLIORATION : Filtrer les quiz par niveau scolaire pour l'utilisateur actuel
  getQuizzesForCurrentUser: (allQuizzes) => {
    const userLevel = authService.getCurrentUserLevel();
    const isStudent = authService.isStudent();
    
    if (!isStudent) {
      // Si ce n'est pas un étudiant, retourner tous les quiz
      return allQuizzes;
    }
    
    if (!userLevel) {
      // Si l'étudiant n'a pas de niveau défini, retourner les quiz sans niveau spécifique
      return allQuizzes.filter(quiz => 
        !quiz.niveau || 
        quiz.niveau === 'Tous niveaux' || 
        quiz.niveau === 'All' ||
        quiz.niveau === ''
      );
    }
    
    // Filtrer les quiz par niveau scolaire exact
    return allQuizzes.filter(quiz => 
      quiz.niveau === userLevel || 
      quiz.niveau === 'Tous niveaux' || 
      quiz.niveau === 'All' ||
      !quiz.niveau || // Quiz sans niveau spécifique
      quiz.niveau === ''
    );
  },

  // ✅ NOUVEAU : Vérifier si l'utilisateur a défini son niveau
  hasUserDefinedLevel: () => {
    const userLevel = authService.getCurrentUserLevel();
    const isStudent = authService.isStudent();
    return isStudent && userLevel && userLevel.trim() !== '';
  },

  // ✅ NOUVEAU : Obtenir les niveaux valides depuis le backend
  getValidLevels: async () => {
    try {
      const response = await axios.get('/auth/niveaux');
      return Array.from(response.data.niveaux); // Convert Set to Array
    } catch (error) {
      // Fallback vers les niveaux en dur si l'endpoint n'est pas disponible
      return [
        "1ère année collège",
        "2ème année collège", 
        "3ème année collège",
        "Tronc commun scientifique",
        "Tronc commun lettres",
        "1ère année baccalauréat",
        "2ème année baccalauréat"
      ];
    }
  },

  // Obtenir tous les niveaux scolaires disponibles (version synchrone)
  getAvailableLevels: () => {
    return [
      "1ère année collège",
      "2ème année collège", 
      "3ème année collège",
      "Tronc commun scientifique",
      "Tronc commun lettres",
      "1ère année baccalauréat",
      "2ème année baccalauréat"
    ];
  },

  // Vérifier si un niveau est valide
  isValidLevel: (level) => {
    const availableLevels = authService.getAvailableLevels();
    return availableLevels.includes(level);
  }
};

// Fonction utilitaire pour décoder le JWT
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}