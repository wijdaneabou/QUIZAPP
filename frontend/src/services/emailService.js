// Utilisez REACT_APP_ comme préfixe pour les variables d'environnement dans React
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8080/api';

// Fonction pour envoyer un email de réinitialisation de mot de passe
export const sendPasswordResetEmail = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      let errorText = await response.text(); // ✅ change ici
      throw new Error(errorText || 'Erreur lors de l\'envoi de l\'email de réinitialisation');
    }

    return await response.json(); // ✅ si succès, on attend du JSON
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    throw error;
  }
};

// Fonction pour réinitialiser le mot de passe
export const resetPassword = async (token, email, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        email,
        password: newPassword
      }),
    });

    if (!response.ok) {
      // 🔥 CORRECTION: Gérer les erreurs text/plain du backend
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || 'Erreur lors de la réinitialisation du mot de passe';
      } catch {
        // Si ce n'est pas du JSON, récupérer le texte brut
        errorMessage = await response.text() || 'Erreur lors de la réinitialisation du mot de passe';
      }
      throw new Error(errorMessage);
    }

    // 🔥 CORRECTION: Le backend retourne du texte, pas du JSON
    return await response.text(); // au lieu de response.json()
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    throw error;
  }
};

// Fonction pour valider le token de réinitialisation
export const validateResetToken = async (token, email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Token invalide');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la validation du token:', error);
    throw error;
  }
};