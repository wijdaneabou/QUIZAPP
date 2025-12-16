
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, BookOpen, Award, Clock, Settings, TrendingUp, Calendar, Trophy, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import resultsService from '../../services/resultsService';
import userService from '../../services/userService';

const EditProfileModal = ({ isOpen, onClose, userProfile, onSave }) => {
  const [editData, setEditData] = useState({ name: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userProfile) {
      setEditData({
        name: userProfile.name || '',
        email: userProfile.email || ''
      });
      setErrors({});
    }
  }, [userProfile, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!editData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (editData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (!editData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(editData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await onSave(editData);
      onClose();
    } catch (error) {
      setErrors({ general: error.message || 'Erreur lors de la sauvegarde' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: userProfile?.name || '',
      email: userProfile?.email || ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Edit3 className="h-6 w-6 text-blue-600" />
              Modifier le profil
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Nom complet
              </label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Votre nom complet"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Adresse email
              </label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="votre@email.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user: authUser } = useAuth(); 
  const navigate = useNavigate();

  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);


  useEffect(() => {
    const fetchProfileData = async () => {
      if (!authUser || !authUser.id) {
        setError("Utilisateur non identifié. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

 
        const [profileData, resultsData] = await Promise.all([
          userService.getUserProfile(authUser.id),
          resultsService.getUserResults(authUser.id)
        ]);
        
     
        setUserProfile(profileData);

        const stats = resultsService.calculateUserStats(resultsData);
        setUserStats(stats);
        
        const sortedResults = resultsService.sortResults(resultsData, 'date-desc');
        setRecentResults(sortedResults.slice(0, 4)); 

      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError("Impossible de charger les données du profil. " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [authUser]);

  const handleSaveProfile = async (editData) => {
    if (!userProfile) return;
    
    try {
      const updatedUser = await userService.updateUserProfile(userProfile.id, editData);
      setUserProfile(updatedUser); 
  
    } catch (err) {
      throw err; 
    }
  };

 
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }


  if (!userProfile || !userStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <p className="text-gray-600">Données du profil indisponibles.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4">
    
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">{userProfile.name}</h1>
                  <p className="text-blue-100 mb-1 text-lg">{userProfile.email}</p>
                  
                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm border border-white/20">
                      <Trophy className="h-4 w-4 mr-2" />
                      {userProfile.role === 'ADMIN' ? 'Administrateur' : 'Étudiant'}
                    </span>
                     <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm border border-white/20">
                      <Calendar className="h-4 w-4 mr-2" />
                      Inscrit le {userProfile.dateCreation ? new Date(userProfile.dateCreation).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Date inconnue'}
                    </span>
                  </div>
                </div>
                
            
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium hover:bg-white/30 transition-all duration-200 flex items-center gap-2 border border-white/20"
                  >
                    <Edit3 className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => navigate('student/settings')}
                    className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium hover:bg-white/20 transition-all duration-200 flex items-center gap-2 border border-white/20"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
     
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Mes performances
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
             
                <div className="group hover:scale-105 transition-transform duration-200">
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg">
                    <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-center w-fit mb-4">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-gray-600 text-sm mb-1">Quiz complétés</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.totalQuizzes}</p>
                  </div>
                </div>
                <div className="group hover:scale-105 transition-transform duration-200">
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg">
                    <div className="bg-green-50 rounded-xl p-3 flex items-center justify-center w-fit mb-4">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-gray-600 text-sm mb-1">Taux de réussite moyen</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.averageScore.toFixed(1)}%</p>
                  </div>
                </div>
                {/* Carte Meilleur score */}
                <div className="group hover:scale-105 transition-transform duration-200">
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg">
                    <div className="bg-purple-50 rounded-xl p-3 flex items-center justify-center w-fit mb-4">
                      <Trophy className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-gray-600 text-sm mb-1">Meilleur score</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.bestScore.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                Activité récente
              </h2>
              
              <div className="space-y-4">
                {recentResults.length > 0 ? (
                  recentResults.map((result) => (
                    <div key={result.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 rounded-full mt-2 bg-green-500"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 font-medium">Quiz "{result.quiz.title}" terminé</p>
                        <p className="text-xs text-gray-500">{new Date(result.takenAt).toLocaleString('fr-FR')}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {result.percentage.toFixed(0)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <button 
                  onClick={() => navigate('/student/results')} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Voir tous mes résultats
                </button>
                <button 
                  onClick={() => navigate('/student/quizzes')} 
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Quiz disponibles
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userProfile={userProfile}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default ProfilePage;