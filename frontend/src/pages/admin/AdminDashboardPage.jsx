import { useState, useEffect } from 'react';
import { 
  Users, BookOpen,TrendingUp,Award,Eye,Plus,BarChart3,Activity,Clock,CheckCircle,XCircle,AlertTriangle,RefreshCw,Target,Sparkles,BarChart,Brain,Settings,Lightbulb, TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const API_BASE_URL = 'http://localhost:8080/api';

const dashboardService = {
  getStats: async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const [usersResponse, quizzesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/users`, { headers }),
        fetch(`${API_BASE_URL}/quizzes`, { headers }) 
      ]);

      if (!usersResponse.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
      
      const users = await usersResponse.json();
      const quizzes = quizzesResponse.ok ? await quizzesResponse.json() : [];

      const totalUsers = users.length;
      const activeUsers = users.filter(user => user.isActive).length;
      const totalQuizzes = quizzes.length;
      
     
      const totalAttempts = Math.floor(totalUsers * 8.5); 
      const averageScore = 78.5 + Math.random() * 10; 

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalQuizzes,
        totalAttempts,
        averageScore,
        adminUsers: users.filter(user => user.role === 'ADMIN').length,
        regularUsers: users.filter(user => user.role === 'USER').length
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getRecentUsers: async (limit = 10) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
      
      const users = await response.json();
 
      return users
        .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
        .slice(0, limit)
        .map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          action: 'Inscription',
          time: formatTimeAgo(new Date(user.dateCreation)),
          status: user.isActive ? 'active' : 'inactive',
          role: user.role
        }));
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getUserGrowth: async () => {
  try {
    const token = localStorage.getItem('token');
    
    // Ajouter un timestamp pour éviter le cache
    const response = await fetch(`${API_BASE_URL}/users?t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-cache' // Force le rechargement
    });

    if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
    
    const users = await response.json();
    
    // DEBUG CRITIQUE : Afficher les 3 premiers utilisateurs
    console.log('=== DEBUG UTILISATEURS ===');
    console.log('Nombre total:', users.length);
    console.log('Premiers utilisateurs:', users.slice(0, 3));
    
    // Vérifier le nom exact du champ de date
    if (users.length > 0) {
      console.log('Champs disponibles:', Object.keys(users[0]));
      console.log('dateCreation:', users[0].dateCreation);
      console.log('createdAt:', users[0].createdAt);
      console.log('created_at:', users[0].created_at);
      console.log('date:', users[0].date);
    }
    
    // Si pas d'utilisateurs, retourner des zéros
    if (!users || users.length === 0) {
      return {
        thisMonth: 0,
        lastMonth: 0,
        thisWeek: 0,
        lastWeek: 0,
        last30Days: 0,
        previous30Days: 0,
        monthlyPercentageChange: 0,
        weeklyPercentageChange: 0,
        percentageChange: 0
      };
    }
    
    const now = new Date();
    console.log('Date actuelle:', now);
    
    // APPROCHE 1: Derniers 30 jours vs 30 jours précédents (plus flexible)
    const last30DaysDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last60DaysDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    console.log('Filtre 30 jours depuis:', last30DaysDate);
    
    // Essayer différents noms de champs possibles
    const usersLast30Days = users.filter(user => {
      const dateField = user.dateCreation || user.createdAt || user.created_at || user.date;
      if (!dateField) {
        console.warn('Pas de date trouvée pour user:', user.id);
        return false;
      }
      const userDate = new Date(dateField);
      const isRecent = userDate >= last30DaysDate && userDate <= now;
      if (isRecent) {
        console.log('✅ User récent trouvé:', user.name, userDate);
      }
      return isRecent;
    }).length;
    
    const usersPrevious30Days = users.filter(user => {
      const dateField = user.dateCreation || user.createdAt || user.created_at || user.date;
      if (!dateField) return false;
      const userDate = new Date(dateField);
      return userDate >= last60DaysDate && userDate < last30DaysDate;
    }).length;
    
    // APPROCHE 2: Derniers 7 jours vs 7 jours précédents
    const last7DaysDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last14DaysDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    console.log('Filtre 7 jours depuis:', last7DaysDate);
    
    const usersLast7Days = users.filter(user => {
      const dateField = user.dateCreation || user.createdAt || user.created_at || user.date;
      if (!dateField) return false;
      const userDate = new Date(dateField);
      const isRecent = userDate >= last7DaysDate && userDate <= now;
      if (isRecent) {
        console.log('✅ User cette semaine:', user.name, userDate);
      }
      return isRecent;
    }).length;
    
    const usersPrevious7Days = users.filter(user => {
      const dateField = user.dateCreation || user.createdAt || user.created_at || user.date;
      if (!dateField) return false;
      const userDate = new Date(dateField);
      return userDate >= last14DaysDate && userDate < last7DaysDate;
    }).length;
    
    // Calcul des mois calendaires pour affichage
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const usersThisMonth = users.filter(user => {
      const dateField = user.dateCreation || user.createdAt || user.created_at || user.date;
      if (!dateField) return false;
      const userDate = new Date(dateField);
      return userDate >= startOfCurrentMonth && userDate <= now;
    }).length;
    
    const usersLastMonth = users.filter(user => {
      const dateField = user.dateCreation || user.createdAt || user.created_at || user.date;
      if (!dateField) return false;
      const userDate = new Date(dateField);
      return userDate >= startOfLastMonth && userDate < startOfCurrentMonth;
    }).length;
    
    // Calcul du pourcentage de croissance (30 jours)
    let monthlyPercentageChange = 0;
    if (usersPrevious30Days > 0) {
      monthlyPercentageChange = Math.round(((usersLast30Days - usersPrevious30Days) / usersPrevious30Days) * 100);
    } else if (usersLast30Days > 0) {
      monthlyPercentageChange = 100;
    }
    
    // Calcul du pourcentage de croissance (7 jours)
    let weeklyPercentageChange = 0;
    if (usersPrevious7Days > 0) {
      weeklyPercentageChange = Math.round(((usersLast7Days - usersPrevious7Days) / usersPrevious7Days) * 100);
    } else if (usersLast7Days > 0) {
      weeklyPercentageChange = 100;
    }
    
    // Debug: afficher dans la console
    console.log('=== STATISTIQUES DE CROISSANCE ===');
    console.log('Total utilisateurs:', users.length);
    console.log('Derniers 30 jours:', usersLast30Days);
    console.log('30 jours précédents:', usersPrevious30Days);
    console.log('Derniers 7 jours:', usersLast7Days);
    console.log('7 jours précédents:', usersPrevious7Days);
    console.log('Croissance mensuelle:', monthlyPercentageChange + '%');
    console.log('Croissance hebdomadaire:', weeklyPercentageChange + '%');
    
    return {
      thisMonth: usersThisMonth,
      lastMonth: usersLastMonth,
      thisWeek: usersLast7Days,
      lastWeek: usersPrevious7Days,
      last30Days: usersLast30Days,
      previous30Days: usersPrevious30Days,
      monthlyPercentageChange: monthlyPercentageChange,
      weeklyPercentageChange: weeklyPercentageChange,
      percentageChange: monthlyPercentageChange
    };
  } catch (error) {
    console.error('Erreur getUserGrowth:', error);
    throw new Error(error.message);
  }
}
};


const formatTimeAgo = (date) => {
  if (!date || isNaN(new Date(date).getTime())) {
    return "Date invalide";
  }
  
  const now = new Date();
  const dateObj = new Date(date);
  const diffTime = Math.abs(now - dateObj);
  
  
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  

  if (diffMinutes < 60) {
    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes === 1) return "Il y a 1 minute";
    return `Il y a ${diffMinutes} minutes`;
  }
  
  if (diffHours < 24) {
    if (diffHours === 1) return "Il y a 1 heure";
    return `Il y a ${diffHours} heures`;
  }
  
  if (diffDays < 7) {
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} jours`;
  }
  
  if (diffDays < 30) {
    if (diffWeeks === 1) return "Il y a 1 semaine";
    return `Il y a ${diffWeeks} semaines`;
  }
  
  if (diffDays < 365) {
    if (diffMonths === 1) return "Il y a 1 mois";
    return `Il y a ${diffMonths} mois`;
  }
  
  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return "Il y a 1 an";
  return `Il y a ${diffYears} ans`;
};


const getRecentUsersImproved = async (limit = 10) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
    
    const users = await response.json();
  
    return users
      .filter(user => user.dateCreation) 
      .sort((a, b) => {
        const dateA = new Date(a.dateCreation);
        const dateB = new Date(b.dateCreation);
       
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        return dateB - dateA; 
      })
      .slice(0, limit)
      .map(user => ({
        id: user.id,
        name: user.name || 'Nom indisponible',
        email: user.email || 'Email indisponible',
        action: 'Inscription',
        time: formatTimeAgo(user.dateCreation),
        status: user.isActive ? 'active' : 'inactive',
        role: user.role || 'USER'
      }));
  } catch (error) {
    throw new Error(error.message);
  }
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalQuizzes: 0,
    totalAttempts: 0,
    averageScore: 0,
    adminUsers: 0,
    regularUsers: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [userGrowth, setUserGrowth] = useState({ thisMonth: 0, thisWeek: 0, percentageChange: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, recentUsersData, growthData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentUsers(8),
        dashboardService.getUserGrowth()
      ]);

      setStats(statsData);
      setRecentActivities(recentUsersData);
      setUserGrowth(growthData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement du dashboard:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadDashboardData();
    
    // Actualisation automatique toutes les 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, title, value, color, change, subtitle, trend }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r`} style={{ 
          background: `linear-gradient(135deg, ${color}20, ${color}10)` 
        }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            change > 0 ? 'bg-green-100 text-green-700' : 
            change < 0 ? 'bg-red-100 text-red-700' : 
            'bg-gray-100 text-gray-700'
          }`}>
            {change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : 
             change < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : 
             <Target className="w-3 h-3 mr-1" />}
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );

  const ActivityItem = ({ activity, index }) => {
    const getActivityIcon = () => {
      switch (activity.action) {
        case 'Inscription': return <Users className="w-4 h-4 text-blue-500" />;
        case 'Quiz complété': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'Quiz créé': return <Plus className="w-4 h-4 text-purple-500" />;
        default: return <Activity className="w-4 h-4 text-gray-500" />;
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'inactive': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex-shrink-0 mt-1">
          {getActivityIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.name}
            </p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
              {activity.status === 'active' ? 'Actif' : 'Inactif'}
            </span>
            {activity.role === 'ADMIN' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Admin
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">
            {activity.action} • {activity.email}
          </p>
          <p className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {activity.time}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>  
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={loadDashboardData}
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button 
              onClick={() => navigate('/admin/quiz/add')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors shadow-lg">
               
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Quiz
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Utilisateurs"
            value={stats.totalUsers.toLocaleString()}
            color="#3B82F6"
            change={userGrowth.percentageChange}
            subtitle={`${stats.activeUsers} actifs • ${stats.inactiveUsers} inactifs`}
          />
          <StatCard
            icon={BookOpen}
            title="Quiz Disponibles"
            value={stats.totalQuizzes}
            color="#10B981"
            change={8}
            subtitle="Tous catégories confondues"
          />
          <StatCard
            icon={Activity}
            title="Tentatives Total"
            value={stats.totalAttempts.toLocaleString()}
            color="#F59E0B"
            change={15}
            subtitle={`Moyenne: ${Math.round(stats.totalAttempts / (stats.totalUsers || 1))} par utilisateur`}
          />
          <StatCard
            icon={Award}
            title="Score Moyen Global"
            value={`${stats.averageScore.toFixed(1)}%`}
            color="#EF4444"
            change={-2}
            subtitle="Toutes tentatives confondues"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Répartition des Rôles</h3>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Administrateurs</span>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-gray-900 mr-2">{stats.adminUsers}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(stats.adminUsers / stats.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Utilisateurs</span>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-gray-900 mr-2">{stats.regularUsers}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(stats.regularUsers / stats.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Croissance</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ce mois</span>
                <span className="text-sm font-semibold text-green-600">+{userGrowth.thisMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cette semaine</span>
                <span className="text-sm font-semibold text-blue-600">+{userGrowth.thisWeek}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Statut Comptes</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Comptes actifs</span>
                <span className="text-sm font-semibold text-green-600">{stats.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Comptes inactifs</span>
                <span className="text-sm font-semibold text-red-600">{stats.inactiveUsers}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  Activités Récentes
                </h2>
                <span className="text-sm text-gray-500">{recentActivities.length} activités</span>
              </div>
            </div>
            <div className="p-2">
              <div className="max-h-96 overflow-y-auto">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <ActivityItem key={activity.id || index} activity={activity} index={index} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune activité récente</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-200">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                  Voir toutes les activités →
                </button>
              </div>
            </div>
          </div>

          {/* IA Features */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                Fonctionnalités IA
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <Brain className="w-5 h-5 text-purple-600 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Génération Automatique</span>
                      <p className="text-xs text-gray-500">QCM intelligents par sujet</p>
                    </div>
                  </div>
                  <span className="text-sm text-purple-600 font-medium">Actif</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Personnalisation Niveau</span>
                      <p className="text-xs text-gray-500">Difficulté adaptative</p>
                    </div>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">Disponible</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Lightbulb className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Explications Auto</span>
                      <p className="text-xs text-gray-500">Corrections intelligentes</p>
                    </div>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Actif</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <BarChart className="w-5 h-5 text-orange-600 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Analytics Prédictifs</span>
                      <p className="text-xs text-gray-500">Analyse des performances</p>
                    </div>
                  </div>
                  <span className="text-sm text-orange-600 font-medium">Beta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
         
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Actions Rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
            onClick={() => navigate('/admin/quiz/add')}
            className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300">
              
              <Plus className="w-10 h-10 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
              <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Créer un Quiz</p>
              <p className="text-xs text-gray-500 mt-1">Nouveau questionnaire</p>
            </button>
            
            <button 
            onClick={() => navigate('/admin/user-management')}
            className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300">
              <Users className="w-10 h-10 text-gray-400 group-hover:text-green-500 mx-auto mb-3 transition-colors" />
              <p className="text-sm font-medium text-gray-700 group-hover:text-green-700">Gérer Utilisateurs</p>
              <p className="text-xs text-gray-500 mt-1">Comptes et permissions</p>
            </button>
            
            <button 
            onClick={() => navigate('/admin/results')}
            className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300">
              <BarChart3 className="w-10 h-10 text-gray-400 group-hover:text-purple-500 mx-auto mb-3 transition-colors" />
              <p className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Statistiques Avancées</p>
              <p className="text-xs text-gray-500 mt-1">Analytics détaillées</p>
            </button>
            
            <button 
            onClick={() => navigate('/admin/dashboard')}
            className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-300">
              <Eye className="w-10 h-10 text-gray-400 group-hover:text-orange-500 mx-auto mb-3 transition-colors" />
              <p className="text-sm font-medium text-gray-700 group-hover:text-orange-700">Monitoring</p>
              <p className="text-xs text-gray-500 mt-1">Surveillance temps réel</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;