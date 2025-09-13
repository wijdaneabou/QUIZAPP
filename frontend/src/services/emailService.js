
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8080/api';

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
      let errorText = await response.text(); 
      throw new Error(errorText || 'Erreur lors de l\'envoi de l\'email de réinitialisation');
    }

    return await response.json(); 
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

      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || 'Erreur lors de la réinitialisation du mot de passe';
      } catch {
        errorMessage = await response.text() || 'Erreur lors de la réinitialisation du mot de passe';
      }
      throw new Error(errorMessage);
    }

  
    return await response.text(); 
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    throw error;
  }
};


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