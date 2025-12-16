import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext'; 
import { Users, BookOpen, Award, Trophy, CheckCircle } from 'lucide-react';
import QuizCard from '../../components/QuizCard';
import {
  Brain,
  Target,
  BarChart3,
  Shield,
  Globe,
  Zap,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import userService from '../../services/userService';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États pour les données dynamiques
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalQuizzes: 0,
    quizzesCompleted: 0,
    successRate: 0
  });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données au montage du composant
  useEffect(() => {
    loadDynamicData();
  }, []);

  const loadDynamicData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Charger les données en parallèle
      const [quizzesData, usersData, resultsData] = await Promise.allSettled([
        quizService.getAllQuizzes(),
        userService.getAllUsers(),
        // Optionnel : charger les résultats pour calculer le nombre de quiz complétés
        fetch('/api/results').then(res => res.json()).catch(() => [])
      ]);

      // Traiter les données des quiz
      let quizzes = [];
      if (quizzesData.status === 'fulfilled') {
        quizzes = quizzesData.value || [];
      } else {
        console.warn('Erreur lors du chargement des quiz:', quizzesData.reason);
      }

      // Traiter les données des utilisateurs
      let users = [];
      if (usersData.status === 'fulfilled') {
        users = usersData.value || [];
      } else {
        console.warn('Erreur lors du chargement des utilisateurs:', usersData.reason);
      }

      // Traiter les données des résultats
      let results = [];
      if (resultsData.status === 'fulfilled') {
        results = resultsData.value || [];
      }

      // Calculer les statistiques
      const totalQuestions = quizzes.reduce((total, quiz) => total + (quiz.numberOfQuestions || 0), 0);
      const avgSuccessRate = quizzes.length > 0 ? 
        Math.round(quizzes.reduce((sum, quiz) => sum + (quiz.successRate || 75), 0) / quizzes.length) : 
        87;
      
      // Calculer le nombre de quiz complétés
      // Si les résultats sont disponibles, utiliser le nombre réel
      // Sinon, estimer basé sur le nombre d'utilisateurs et de quiz
      const quizzesCompleted = results.length > 0 ? 
        results.length : 
        Math.round(users.length * quizzes.length * 0.4); // Estimation : 40% de completion rate

      setStats({
        activeUsers: users.length,
        totalQuizzes: quizzes.length,
        quizzesCompleted: quizzesCompleted,
        successRate: avgSuccessRate
      });

      // Sélectionner les quiz récents/recommandés
      const sortedQuizzes = quizzes
        .filter(quiz => quiz.numberOfQuestions > 0) // Seulement les quiz avec questions
        .sort((a, b) => new Date(b.createdAt || b.dateCreated) - new Date(a.createdAt || a.dateCreated))
        .slice(0, 4); // Les 4 plus récents

      setRecentQuizzes(sortedQuizzes);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour démarrer un quiz
  const handleStartQuiz = (quiz) => {
    navigate(`/quiz/${quiz.id}`);
  };

  // Fonction pour éditer un quiz (admin seulement)
  const handleEditQuiz = (quiz) => {
    navigate(`/admin/quiz/edit/${quiz.id}`);
  };

  // Fonction pour supprimer un quiz (admin seulement)
  const handleDeleteQuiz = async (quiz) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le quiz "${quiz.title}" ?`)) {
      try {
        await quizService.deleteQuiz(quiz.id);
        // Recharger les données après suppression
        loadDynamicData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du quiz');
      }
    }
  };

  // Données statiques pour les statistiques (avec valeurs dynamiques)
  const displayStats = [
    { 
      icon: Users, 
      label: 'Étudiants Actifs', 
      value: loading ? '...' : stats.activeUsers.toLocaleString(), 
      color: 'blue' 
    },
    { 
      icon: BookOpen, 
      label: 'Quiz Disponibles', 
      value: loading ? '...' : stats.totalQuizzes.toLocaleString(), 
      color: 'green' 
    },
    { 
      icon: CheckCircle, 
      label: 'Quiz Complétés', 
      value: loading ? '...' : stats.quizzesCompleted.toLocaleString(), 
      color: 'purple' 
    },
    { 
      icon: Trophy, 
      label: 'Taux de Réussite', 
      value: loading ? '...' : `${stats.successRate}%`, 
      color: 'yellow' 
    },
  ];

  const features = [
    {
      icon: Brain,
      title: 'IA Génératrice',
      description: 'Génération automatique de quiz avec intelligence artificielle avancée',
      color: 'bg-blue-500'
    },
    {
      icon: Target,
      title: 'Personnalisation',
      description: 'Adaptez les quiz selon votre niveau et vos préférences',
      color: 'bg-green-500'
    },
    {
      icon: BarChart3,
      title: 'Analyse Détaillée',
      description: 'Suivez vos progrès avec des statistiques complètes',
      color: 'bg-purple-500'
    },
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Plateforme sécurisée avec authentification robuste',
      color: 'bg-red-500'
    },
    {
      icon: Globe,
      title: 'Accessible',
      description: 'Disponible partout, sur tous vos appareils',
      color: 'bg-indigo-500'
    },
    {
      icon: Zap,
      title: 'Rapide',
      description: 'Interface ultra-rapide pour une expérience fluide',
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
<div className="relative bg-white text-gray-900 py-20 overflow-hidden">
  {/* Circuit Animation Background */}
  <div className="absolute inset-0">
    {/* Points bleus et oranges animés formant des circuits */}
    <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
    <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-orange-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
    <div className="absolute top-1/2 right-1/6 w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
    <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
    <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
    <div className="absolute top-1/5 right-1/5 w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
    <div className="absolute top-3/4 right-1/2 w-3 h-3 bg-blue-700 rounded-full animate-pulse" style={{animationDelay: '2.5s'}}></div>
    <div className="absolute bottom-1/3 right-1/5 w-2 h-2 bg-orange-300 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
    <div className="absolute top-1/6 right-2/5 w-4 h-4 bg-blue-300 rounded-full animate-bounce" style={{animationDelay: '0.8s'}}></div>
    <div className="absolute bottom-1/5 right-2/3 w-3 h-3 bg-orange-700 rounded-full animate-pulse" style={{animationDelay: '3.5s'}}></div>
    
    {/* Lignes de circuit en bleu et orange */}
    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 600">
      <path d="M600 150 L700 150 L700 200 L650 200" stroke="#3B82F6" strokeWidth="2" fill="none" className="animate-pulse"/>
      <path d="M550 250 L650 250 L650 300 L600 300 L600 350" stroke="#F97316" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
      <path d="M580 400 L680 400 L680 450" stroke="#2563EB" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1s'}}/>
      <path d="M520 180 L620 180 L620 220" stroke="#EA580C" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1.5s'}}/>
      <circle cx="650" cy="200" r="4" fill="#3B82F6" className="animate-ping" style={{animationDelay: '0.3s'}}/>
      <circle cx="600" cy="350" r="3" fill="#F97316" className="animate-pulse" style={{animationDelay: '0.8s'}}/>
      <circle cx="680" cy="450" r="3" fill="#2563EB" className="animate-bounce" style={{animationDelay: '1.3s'}}/>
      <circle cx="620" cy="220" r="4" fill="#EA580C" className="animate-ping" style={{animationDelay: '1.8s'}}/>
      <circle cx="570" cy="280" r="3" fill="#F59E0B" className="animate-pulse" style={{animationDelay: '2.3s'}}/>
    </svg>
  </div>
  
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Contenu à gauche */}
      <div className="text-left">
        <div className="flex mb-1">
        </div>
        <h1 className="text-2xl md:text-5xl font-bold mb-10 bg-gradient-to-r from-gray-900 via-blue-600 to-orange-500 bg-clip-text text-transparent">
          Générateur Intelligent de Quiz QCM
        </h1>
        <p className="text-base md:text-lg mb-6 text-gray-600 max-w-2xl">
          Créez et participez à des quiz interactifs générés par intelligence artificielle. 
          Renforcez vos compétences avec notre plateforme d'apprentissage moderne.
        </p>
        {user ? (
          <div className="flex gap-4">
            {user.role === 'ADMIN' ? (
              <>
                <button 
                  onClick={() => navigate('/admin/dashboard')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
                >
                  Tableau de Bord Admin
                </button>
                <button 
                  onClick={() => navigate('/admin/quiz/add')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Générer un Quiz
                </button>
              </>
            ) : (
              <button 
                onClick={() => navigate('/student/quizzes')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
              >
                Continuer l'apprentissage
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
            >
              Commencer Maintenant
            </button>
            <button 
              onClick={() => navigate('/home')}
              className="border-2 border-gradient-to-r from-blue-600 to-orange-500 bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text  px-8 py-4 rounded-xl font-semibold hover:bg-gradient-to-r hover:from-blue-600 hover:to-orange-500 hover:text-white transition-all transform hover:scale-105"
            >
              En savoir plus
            </button>
          </div>
        )}
      </div>
      

      <div className="hidden lg:block relative">
        <div className="w-full h-96 relative">
 
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
 
            <path d="M50 200 L150 200 L150 100 L250 100 L250 150 L350 150" 
                  stroke="#3B82F6" strokeWidth="3" fill="none" 
                  className="animate-pulse" strokeDasharray="10,5"/>
            <path d="M100 300 L200 300 L200 250 L300 250 L300 200" 
                  stroke="#F97316" strokeWidth="2" fill="none" 
                  className="animate-pulse" style={{animationDelay: '0.5s'}} strokeDasharray="8,4"/>
            <path d="M70 350 L170 350 L170 320 L270 320" 
                  stroke="#2563EB" strokeWidth="2" fill="none" 
                  className="animate-pulse" style={{animationDelay: '1s'}} strokeDasharray="6,3"/>
            <path d="M120 80 L220 80 L220 120 L320 120" 
                  stroke="#EA580C" strokeWidth="3" fill="none" 
                  className="animate-pulse" style={{animationDelay: '1.5s'}} strokeDasharray="12,6"/>
            

            <circle cx="150" cy="200" r="6" fill="#3B82F6" className="animate-ping"/>
            <circle cx="250" cy="100" r="5" fill="#F97316" className="animate-bounce" style={{animationDelay: '0.3s'}}/>
            <circle cx="350" cy="150" r="7" fill="#2563EB" className="animate-pulse" style={{animationDelay: '0.8s'}}/>
            <circle cx="200" cy="300" r="5" fill="#EA580C" className="animate-ping" style={{animationDelay: '1s'}}/>
            <circle cx="300" cy="250" r="6" fill="#F59E0B" className="animate-bounce" style={{animationDelay: '1.3s'}}/>
            <circle cx="170" cy="350" r="4" fill="#1D4ED8" className="animate-pulse" style={{animationDelay: '1.8s'}}/>
            <circle cx="220" cy="80" r="5" fill="#FB923C" className="animate-ping" style={{animationDelay: '2.3s'}}/>
            <circle cx="270" cy="320" r="4" fill="#3B82F6" className="animate-bounce" style={{animationDelay: '2.8s'}}/>
            <circle cx="320" cy="120" r="6" fill="#F97316" className="animate-pulse" style={{animationDelay: '3.3s'}}/>
            
  
            <circle cx="80" cy="180" r="3" fill="#60A5FA" className="animate-pulse" style={{animationDelay: '0.2s'}}/>
            <circle cx="180" cy="120" r="2" fill="#FDBA74" className="animate-ping" style={{animationDelay: '0.7s'}}/>
            <circle cx="280" cy="180" r="3" fill="#1E40AF" className="animate-bounce" style={{animationDelay: '1.2s'}}/>
            <circle cx="320" cy="280" r="2" fill="#F97316" className="animate-pulse" style={{animationDelay: '1.7s'}}/>
            <circle cx="120" cy="160" r="2" fill="#2563EB" className="animate-ping" style={{animationDelay: '2.2s'}}/>
            <circle cx="240" cy="280" r="3" fill="#FB923C" className="animate-bounce" style={{animationDelay: '2.7s'}}/>
          </svg>
          
       
          <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-orange-400/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 right-1/2 w-18 h-18 bg-blue-600/12 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-1/4 right-1/6 w-14 h-14 bg-orange-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '3s'}}></div>
        </div>
      </div>
    </div>
  </div>
</div>
    
      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">Notre Impact en Chiffres</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Des résultats concrets qui témoignent de l'engagement de notre communauté</p>
          </div>
          {error && (
            <div className="text-center mb-8">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
              <button 
                onClick={loadDynamicData}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Réessayer
              </button>
            </div>
          )}
          
          <div className="grid md:grid-cols-4 gap-8">
            {displayStats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${stat.color}-100 rounded-full mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section conditionnelle selon le rôle de l'utilisateur */}
      {user && user.role === 'ADMIN' ? (
        /* Admin Dashboard Section */
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tableau de Bord Administrateur</h2>
              <p className="text-gray-600">Gérez votre plateforme et surveillez les performances</p>
            </div>
            
            {loading ? (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Chargement des données...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Statistiques détaillées pour admin */}
                <div className="bg-white p-6 rounded-xl shadow-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Statistiques Globales</h3>
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilisateurs actifs</span>
                      <span className="font-semibold">{stats.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quiz créés</span>
                      <span className="font-semibold">{stats.totalQuizzes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quiz complétés</span>
                      <span className="font-semibold">{stats.quizzesCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taux de réussite moyen</span>
                      <span className="font-semibold text-green-600">{stats.successRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Actions rapides pour admin */}
                <div className="bg-white p-6 rounded-xl shadow-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Actions Rapides</h3>
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="space-y-3">
                    <button 
                      onClick={() => navigate('/admin/quiz/add')}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Créer un Quiz
                    </button>
                    <button 
                      onClick={() => navigate('/admin/quiz-management')}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Gérer les Quiz
                    </button>
                    <button 
                      onClick={() => navigate('/admin/user-management')}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Gérer les Utilisateurs
                    </button>
                  </div>
                </div>

                {/* Quiz récents créés */}
                <div className="bg-white p-6 rounded-xl shadow-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Quiz Récents</h3>
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="space-y-3">
                    {recentQuizzes.slice(0, 3).map(quiz => (
                      <div key={quiz.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{quiz.title}</p>
                          <p className="text-xs text-gray-500">{quiz.numberOfQuestions} questions</p>
                        </div>
                        <button 
                          onClick={() => handleEditQuiz(quiz)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Modifier
                        </button>
                      </div>
                    ))}
                    {recentQuizzes.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">Aucun quiz créé</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : user && user.role === 'USER' ? (
        /* Student Quiz Section - UNIQUEMENT pour les étudiants */
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Recommandés</h2>
              <p className="text-gray-600">Continuez votre apprentissage avec ces quiz sélectionnés</p>
            </div>
            
            {loading ? (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Chargement des quiz...</p>
              </div>
            ) : recentQuizzes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentQuizzes.map(quiz => (
                  <QuizCard 
                    key={quiz.id} 
                    quiz={{
                      ...quiz,
                      questions: quiz.numberOfQuestions,
                      duration: quiz.timeLimit || 30
                    }} 
                    onStart={() => handleStartQuiz(quiz)} 
                    onEdit={() => handleEditQuiz(quiz)}
                    onDelete={() => handleDeleteQuiz(quiz)}
                    isAdmin={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Aucun quiz disponible pour le moment</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pourquoi Choisir Notre Plateforme ?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une solution complète alimentée par l'intelligence artificielle pour créer et gérer des quiz éducatifs
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.color} rounded-full mb-4 group-hover:shadow-lg`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

       {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Prêt à commencer ?</h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez des milliers d'étudiants et enseignants qui utilisent déjà notre plateforme
          </p>
          {!user ? (
            <button 
              onClick={() => navigate('/register')}
              style={{ backgroundColor: '#F07F19' }}
              className="text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
            >
              Créer mon compte 
            </button>
          ) : user.role === 'admin' || user.role === 'Admin' || user.role === 'ADMIN' ? (
            <button 
              onClick={() => navigate('/admin/dashboard')}
              style={{ backgroundColor: '#F07F19' }}
              className=" text-white-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Accéder à mon tableau de bord
            </button>
          ) : (
            <button 
              onClick={() => navigate('/student/profile')}
              style={{ backgroundColor: '#F07F19' }}
              className=" text-white-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Accéder à mon profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;