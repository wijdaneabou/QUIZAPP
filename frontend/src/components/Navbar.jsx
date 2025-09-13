import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {BookOpen, Home, BarChart3, Trophy, LogOut, User, X, Menu, Settings,  PlusCircle} from 'lucide-react';
import logo from '../assets/images/logo.svg';
const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation selon le rôle (USER/ADMIN du backend)
  const navItems = user
    ? (user.role === 'ADMIN'
      ? [
          { id: 'home', label: 'Accueil', path: '/', icon: Home },
          { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: BarChart3 },
          { id: 'quizzes', label: 'Gestion Quiz', path: '/admin/quiz-management', icon: BookOpen },
          { id: 'create-quiz', label: 'Créer Quiz', path: '/admin/quiz/add', icon: PlusCircle },
        ]
      : [
          { id: 'home', label: 'Accueil', path: '/', icon: Home },
          { id: 'quizzes', label: 'Mes Quiz', path: '/student/quizzes', icon: BookOpen },
          { id: 'results', label: 'Mes Résultats', path: '/student/results', icon: Trophy },
          
        ])
    : [];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  // Fermer le menu utilisateur quand on clique ailleurs
  const handleUserMenuClick = (e) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  // User menu items selon le rôle
  const getUserMenuItems = () => {
    if (!user) return [];
    if (user.role === 'ADMIN') {
      return [
        { label: 'Dashboard Admin', path: '/admin/dashboard', icon: BarChart3 },
        { label: 'Paramètres', path: '/admin/settings', icon: Settings },
      ];
    } else {
      return [
        { label: 'Mon Profil', path: '/student/profile', icon: User },
        { label: 'Mes Statistiques', path: 'student/results', icon: BarChart3 },
        { label: 'Paramètres', path: '/student/settings', icon: Settings },
      ];
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={logo}
                alt="Yool Education Logo"
                className="h-10 w-auto object-contain mr-3"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 items-center">
            {user && navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center text-sm font-medium px-3 py-2 rounded-md transition-all ${
                  location.pathname === item.path
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            ))}

            {!user && (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Connexion
                </button>
                <button
                  onClick={() => navigate('/register')}
                  style={{ backgroundColor: '#F07F19' }}
                  className="text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Inscription
                </button>

              </>
            )}
          </div>

          {/* User Menu */}
          {user && (
            <div className="hidden md:block">
              <div className="relative">
                <button
                  onClick={handleUserMenuClick}
                  className="flex items-center text-sm hover:bg-gray-100 p-2 rounded-md transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="ml-2 text-gray-700">{user.name}</span>
                  {user.role === 'ADMIN' && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                      Admin
                    </span>
                  )}
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10 border">
                    <div className="py-1">
                      {/* Infos utilisateur */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-blue-600 font-medium">
                          {user.role === 'ADMIN' ? 'Administrateur' : 'Étudiant'}
                        </p>
                      </div>
                      
                      {/* Menu items selon le rôle */}
                      {getUserMenuItems().map((item, index) => (
                        <Link 
                          key={index}
                          to={item.path}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Link>
                      ))}
                      
                      <div className="border-t border-gray-100"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-3 space-y-1 bg-white border-t">
          {user ? (
            <>
              {/* Infos utilisateur mobile */}
              <div className="px-3 py-2 border-b border-gray-200 mb-2">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                <p className="text-xs text-blue-600 font-medium">
                  {user.role === 'ADMIN' ? 'Administrateur' : 'Étudiant'}
                </p>
              </div>

              {/* Navigation principale */}
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === item.path
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              ))}
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                {/* Menu items selon le rôle en mobile */}
                {getUserMenuItems().map((item, index) => (
                  <Link 
                    key={index}
                    to={item.path}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                ))}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-3 py-2 rounded-md text-base text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate('/login');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base text-gray-700 hover:bg-gray-100"
              >
                Connexion
              </button>
              <button
                onClick={() => {
                  navigate('/register');
                  setIsMenuOpen(false);
                }}
                className="bg-blue-600 text-white w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
              >
                Inscription
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;