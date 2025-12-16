import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../auth/AuthContext';

const GoogleLoginButton = ({ onSuccess, onError, isSignUp = false }) => {
  const { loginWithGoogle } = useAuth();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const userData = await loginWithGoogle(credentialResponse.credential);
      onSuccess?.(userData);
    } catch (error) {
      console.error('Erreur Google Login:', error.message);
      onError?.('Erreur lors de la connexion Google');
    }
  };

  const handleGoogleError = () => {
    const errorMessage = 'Échec de connexion Google';
    console.log(errorMessage);
    onError?.(errorMessage);
  };
  
  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        auto_select={false}
        theme="outline"
        size="large"
        text={isSignUp ? "signup_with" : "signin_with"}
        width="100%"
        locale="fr"
        context={isSignUp ? "signup" : "signin"}
        ux_mode="popup"
        prompt="select_account"
      />
    </div>
  );
};

export default GoogleLoginButton;