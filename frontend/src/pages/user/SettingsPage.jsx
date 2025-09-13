// SettingsPage.jsx - Page de paramètres complète

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  ArrowLeft,
  Trash2,
  Download,
  Upload,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import userService from '../../services/userService';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: 'from-red-600 to-red-700 bg-red-50 border-red-200 text-red-600',
    warning: 'from-yellow-600 to-yellow-700 bg-yellow-50 border-yellow-200 text-yellow-600'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className={`mb-4 p-3 ${typeStyles[type].split(' ').slice(2).join(' ')} rounded-lg`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">{title}</h3>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className={`flex-1 bg-gradient-to-r ${typeStyles[type].split(' ').slice(0, 2).join(' ')} text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-200`}
            >
              Confirmer
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuccessToast = ({ isVisible, message, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in">
      <Check className="h-5 w-5" />
      <span>{message}</span>
    </div>
  );
};

const SettingsPage = () => {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  // États pour les paramètres
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });

  // États pour les préférences
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'fr',
    soundEnabled: true,
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    weeklyDigest: true,
    instantResults: true
  });

  // États pour la sécurité
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  // Effet pour charger les données
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser || !authUser.id) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const profileData = await userService.getUserProfile(authUser.id);
        setUserProfile(profileData);
        
        // Charger les préférences utilisateur (simulé)
        const userPreferences = await userService.getUserPreferences(authUser.id);
        if (userPreferences) {
          setPreferences(prev => ({ ...prev, ...userPreferences }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser, navigate]);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await userService.updateUserPreferences(authUser.id, preferences);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (security.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setSaving(true);
    try {
      await userService.changePassword(authUser.id, {
        currentPassword: security.currentPassword,
        newPassword: security.newPassword
      });
      setSecurity(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      alert('Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      data: null
    });
  };

  const handleExportData = async () => {
    try {
      const data = await userService.exportUserData(authUser.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const confirmAction = async () => {
    if (confirmModal.type === 'delete') {
      try {
        await userService.deleteAccount(authUser.id);
        logout();
        navigate('/');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
    setConfirmModal({ isOpen: false, type: '', data: null });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-gray-900 text-white">
            <div className="relative p-8">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => navigate('/student/profile')}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Paramètres</h1>
                  <p className="text-gray-300">Gérez votre compte et vos préférences</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu de navigation des paramètres */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <nav className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium flex items-center gap-3">
                  <User className="h-5 w-5" />
                  Profil
                </button>
                <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium flex items-center gap-3 transition-colors">
                  <Bell className="h-5 w-5" />
                  Notifications
                </button>
                <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium flex items-center gap-3 transition-colors">
                  <Palette className="h-5 w-5" />
                  Apparence
                </button>
                <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium flex items-center gap-3 transition-colors">
                  <Shield className="h-5 w-5" />
                  Sécurité
                </button>
                <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium flex items-center gap-3 transition-colors">
                  <Globe className="h-5 w-5" />
                  Confidentialité
                </button>
              </nav>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section Préférences générales */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Palette className="h-6 w-6 text-blue-600" />
                Préférences générales
              </h2>
              
              <div className="space-y-6">
                {/* Thème */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Thème</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                        preferences.theme === 'light' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Sun className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">Clair</span>
                    </button>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, theme: 'dark' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                        preferences.theme === 'dark' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Moon className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">Sombre</span>
                    </button>
                  </div>
                </div>

                {/* Langue */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Langue</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>

                {/* Sons */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {preferences.soundEnabled ? (
                        <Volume2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <VolumeX className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-700">Sons activés</label>
                        <p className="text-xs text-gray-500">Sons lors des interactions</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Notifications */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Bell className="h-6 w-6 text-blue-600" />
                Notifications
              </h2>
              
              <div className="space-y-6">
                {/* Notifications par email */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notifications par email</label>
                      <p className="text-xs text-gray-500">Recevoir les notifications importantes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Notifications push */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notifications push</label>
                      <p className="text-xs text-gray-500">Notifications sur votre appareil</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Emails marketing */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Emails marketing</label>
                      <p className="text-xs text-gray-500">Offres et actualités produit</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, marketingEmails: !prev.marketingEmails }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.marketingEmails ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Résumé hebdomadaire */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-orange-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Résumé hebdomadaire</label>
                      <p className="text-xs text-gray-500">Rapport de vos performances</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, weeklyDigest: !prev.weeklyDigest }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.weeklyDigest ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Section Sécurité */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Shield className="h-6 w-6 text-blue-600" />
                Sécurité
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                  <div className="relative">
                    <input
                      type={security.showCurrentPassword ? 'text' : 'password'}
                      value={security.currentPassword}
                      onChange={(e) => setSecurity(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    <button
                      type="button"
                      onClick={() => setSecurity(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {security.showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={security.showNewPassword ? 'text' : 'password'}
                      value={security.newPassword}
                      onChange={(e) => setSecurity(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nouveau mot de passe (min. 6 caractères)"
                    />
                    <button
                      type="button"
                      onClick={() => setSecurity(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {security.showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={security.showConfirmPassword ? 'text' : 'password'}
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setSecurity(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {security.showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={saving || !security.currentPassword || !security.newPassword || !security.confirmPassword}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" />
                  Changer le mot de passe
                </button>
              </div>
            </div>

            {/* Section Données et confidentialité */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Globe className="h-6 w-6 text-blue-600" />
                Données et confidentialité
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Download className="h-5 w-5 text-blue-600" />
                    Exporter mes données
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Téléchargez une copie de toutes vos données personnelles et résultats de quiz.
                  </p>
                  <button
                    onClick={handleExportData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Télécharger mes données
                  </button>
                </div>

                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Zone de danger
                  </h3>
                  <p className="text-sm text-red-600 mb-3">
                    Attention : Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </div>

            {/* Bouton de sauvegarde global */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Sauvegarder les modifications</h3>
                  <p className="text-sm text-gray-500">Appliquer tous les changements de préférences</p>
                </div>
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', data: null })}
        onConfirm={confirmAction}
        title="Supprimer le compte"
        message="Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible et toutes vos données seront perdues."
        type="danger"
      />

      {/* Toast de succès */}
      <SuccessToast
        isVisible={showSuccessToast}
        message="Paramètres sauvegardés avec succès !"
        onClose={() => setShowSuccessToast(false)}
      />

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;