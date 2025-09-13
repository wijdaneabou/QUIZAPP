import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ÉTAPE 1: Importer le fournisseur d'authentification Google
import { GoogleOAuthProvider } from '@react-oauth/google';

// ÉTAPE 2: Placer votre ID Client ici. (Il est fortement recommandé d'utiliser une variable d'environnement)
// Pour un projet Vite, créez un fichier .env à la racine et mettez-y :
// VITE_GOOGLE_CLIENT_ID="VOTRE_ID_CLIENT_ICI"
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "345457357798-ojq3hgvenb95cph5fcjoquk22n9clbqv.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)