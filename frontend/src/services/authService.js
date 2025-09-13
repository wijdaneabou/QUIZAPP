import axios from '../api/axios';

export const authService = {

  register: async (userData) => {
    try {
     
      const registrationData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role
      };

      if (userData.level && userData.role === 'USER') {
        registrationData.niveau = userData.level; 
      }

      const response = await axios.post('/auth/register', registrationData);
      
      const { token, user } = response.data;
      

      localStorage.setItem('token', token);
      
     
      const userToStore = {
        ...user,
        level: user.niveau || userData.level || null 
      };
      
      localStorage.setItem('user', JSON.stringify(userToStore));
      

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

   
      const userToStore = {
        ...user,
        level: user.niveau || null 
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userToStore));

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
      const userToStore = {
        email: user.email,
        name: user.name,
        role: user.role || 'USER',
        level: user.niveau || null, 
        id: user.id
      };
      
    
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userToStore));
     
      if (user.niveau) {
        localStorage.setItem('userLevel', user.niveau);
      }
      
      return token;
    } catch (error) {
      throw new Error(error.response?.data || 'Erreur lors de la connexion Google');
    }
  },

  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userLevel');
  },

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


  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },


  getCurrentUserLevel: () => {
    return localStorage.getItem('userLevel');
  },

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
      
   
      localStorage.setItem('userLevel', newLevel);
    
      if (currentUser) {
        currentUser.level = newLevel;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data || 'Erreur lors de la mise à jour du niveau');
    }
  },


  isStudent: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'USER';
  },

  isTeacher: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'ADMIN';
  },


  getToken: () => {
    return localStorage.getItem('token');
  },

  getQuizzesForCurrentUser: (allQuizzes) => {
    const userLevel = authService.getCurrentUserLevel();
    const isStudent = authService.isStudent();
    
    if (!isStudent) {
    
      return allQuizzes;
    }
    
    if (!userLevel) {
 
      return allQuizzes.filter(quiz => 
        !quiz.niveau || 
        quiz.niveau === 'Tous niveaux' || 
        quiz.niveau === 'All' ||
        quiz.niveau === ''
      );
    }

    return allQuizzes.filter(quiz => 
      quiz.niveau === userLevel || 
      quiz.niveau === 'Tous niveaux' || 
      quiz.niveau === 'All' ||
      !quiz.niveau || 
      quiz.niveau === ''
    );
  },

  hasUserDefinedLevel: () => {
    const userLevel = authService.getCurrentUserLevel();
    const isStudent = authService.isStudent();
    return isStudent && userLevel && userLevel.trim() !== '';
  },

  getValidLevels: async () => {
    try {
      const response = await axios.get('/auth/niveaux');
      return Array.from(response.data.niveaux); 
    } catch (error) {
    
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