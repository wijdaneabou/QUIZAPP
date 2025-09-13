import api from '../api/axios';

const userService = {

  async getAllUsers() {
    try {
      console.log('API Call: Récupération de tous les utilisateurs');
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de tous les utilisateurs:", error);
      throw error;
    }
  },

  async getUserProfile(userId) {
    if (!userId) {
      throw new Error("L'ID de l'utilisateur est requis pour récupérer le profil.");
    }
    try {
      console.log(`API Call: Récupération du profil pour l'utilisateur ID: ${userId}`);
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du profil pour l'utilisateur ${userId}:`, error);
      throw error;
    }
  },
  
  async getUserByEmail(email) {
    try {
      console.log(`API Call: Recherche de l'utilisateur par email: ${email}`);
      const response = await api.get(`/users/email/${email}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la recherche de l'utilisateur par email ${email}:`, error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      console.log('API Call: Création d\'un nouvel utilisateur', userData);
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      throw error;
    }
  },
  
  async updateUserProfile(userId, profileData) {
    if (!userId) {
      throw new Error("L'ID de l'utilisateur est requis pour la mise à jour.");
    }
    try {
      console.log(`API Call: Mise à jour du profil pour l'utilisateur ID: ${userId}`, profileData);
      const response = await api.put(`/users/${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du profil pour l'utilisateur ${userId}:`, error);
      throw error;
    }
  },
  
  async deleteUser(userId) {
    try {
      console.log(`API Call: Suppression de l'utilisateur ID: ${userId}`);
      await api.delete(`/users/${userId}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
};

export default userService;