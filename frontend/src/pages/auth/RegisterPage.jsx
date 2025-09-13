import React, { useState } from 'react';
import { BookOpen, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, GraduationCap, UserCheck, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../../components/GoogleLogin';
import { authService } from '../../services/authService';

const RegisterPage = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    level: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);


  const levelOptions = [
    { value: '', label: 'Sélectionnez votre niveau' },
    { value: '1ère année collège', label: '1ère année collège' },
    { value: '2ème année collège', label: '2ème année collège' },
    { value: '3ème année collège', label: '3ème année collège' },
    { value: 'Tronc commun scientifique', label: 'Tronc commun scientifique' },
    { value: 'Tronc commun lettres', label: 'Tronc commun lettres' },
    { value: '1ère année baccalauréat', label: '1ère année baccalauréat' },
    { value: '2ème année baccalauréat', label: '2ème année baccalauréat' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role' && value === 'teacher') {
      setFormData({ ...formData, [name]: value, level: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Le nom complet est requis');
      return false;
    }
    if (!formData.email.trim()) {
      setError("L'adresse email est requise");
      return false;
    }
    if (!formData.password) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (!formData.role) {
      setError('Veuillez sélectionner un rôle');
      return false;
    }
    if (formData.role === 'student' && !formData.level) {
      setError('Veuillez sélectionner votre niveau');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    
    try {
      console.log('Données d\'inscription:', formData);
      
      const backendRole = formData.role === 'student' ? 'USER' : 'ADMIN';
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: backendRole
      };

      if (formData.role === 'student' && formData.level) {
        userData.level = formData.level;
        console.log('Niveau étudiant ajouté:', formData.level);
      }

      console.log('Données envoyées au backend:', userData);

      const response = await authService.register(userData);

      console.log('Inscription réussie :', response);
      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Erreur inscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      navigate('/dashboard'); 
    }, 2000);
  };

  const handleGoogleError = (errorMessage) => {
    setError(errorMessage || 'Erreur lors de l\'inscription avec Google. Veuillez réessayer.');
    setGoogleLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Inscription réussie !</h2>
          <p className="text-gray-700">
            Votre compte a été créé avec succès. Vous allez être redirigé dans quelques secondes...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            Continuer vers le tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Créez votre compte</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              connectez-vous à votre compte existant
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Sélectionnez votre rôle</p>
            <div className="flex space-x-4">
              <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center space-x-2 ${formData.role === 'student' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <span>Étudiant</span>
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
              <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center space-x-2 ${formData.role === 'teacher' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                <UserCheck className="h-5 w-5 text-blue-600" />
                <span>Enseignant</span>
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={formData.role === 'teacher'}
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {formData.role === 'student' && (
            <div className="relative">
              <Award className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                disabled={loading || googleLoading}
                required
              >
                {levelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}

      
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              name="name"
              type="text"
              required
              placeholder="Nom complet"
              value={formData.name}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={loading || googleLoading}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              name="email"
              type="email"
              required
              placeholder="Adresse email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={loading || googleLoading}
            />
          </div>

   
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Mot de passe (min. 6 caractères)"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={loading || googleLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading || googleLoading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              placeholder="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={loading || googleLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading || googleLoading}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-start text-red-600 text-sm bg-red-50 p-4 rounded-lg border border-red-200">
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Erreur d'inscription</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-2">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
              disabled={loading || googleLoading}
            />
            <label htmlFor="terms" className="text-sm text-gray-900 leading-tight">
              J'accepte les{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 transition-colors">
                conditions d'utilisation
              </a>{' '}
              et la{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 transition-colors">
                politique de confidentialité
              </a>
            </label>
          </div>

 
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex justify-center py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Inscription en cours...
              </div>
            ) : (
              "S'inscrire"
            )}
          </button>
        </form>

     
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gradient-to-br from-blue-50 to-purple-50 text-gray-500">
              Ou continuez avec
            </span>
          </div>
        </div>


        <div className="mt-6">
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            isSignUp={true}
          />
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              disabled={loading || googleLoading}
            >
              Connectez-vous ici
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;