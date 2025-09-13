import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../auth/AuthContext';

const GoogleLoginButton = ({ onSuccess, onError, isSignUp = false }) => {
  const { loginWithGoogle } = useAuth();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google token:', credentialResponse?.credential);
      await loginWithGoogle(credentialResponse.credential);
      onSuccess?.();
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
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={handleGoogleError}
      useOneTap={false}
      render={renderProps => (
        <button
          onClick={renderProps.onClick}
          disabled={renderProps.disabled}
          className="custom-google-button w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c141.3 0 211.6 105.5 230.1 177.2l-80.3 58.8C364.9 224.6 338.2 208 248 208 138.7 208 47.6 312.9 44.2 342.6l85.6-62.1C144.2 285.1 162.1 308 248 308c70.2 0 139.8-38.1 214.1-88.7L425.3 345c-60.4 95.8-151.7 208-248 208-38.7 0-88.7-15.9-139.7-44.2l80.3-58.8C102.4 409.6 48 342.6 48 256 48 114.5 144.9 0 248 0s203.4 114.5 203.4 248c0 36.9-14.8 82.7-44.2 139.7l-80.3-58.8z"/>
          </svg>
          {isSignUp ? "S'inscrire avec Google" : "Se connecter avec Google"}
        </button>
      )}
    />
  );
};

export default GoogleLoginButton;
