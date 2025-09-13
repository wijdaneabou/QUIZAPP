import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Copy,
  BookOpen,
  Users,
  Clock,
  Star,
  ChevronDown,
  Calendar,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';

const QuizManagementPage = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuizzes, setSelectedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Catégories et statuts dynamiques basés sur vos données
  const [categories, setCategories] = useState(['all']);
  const [difficulties, setDifficulties] = useState(['all']);

  const difficultyLabels = {
    'EASY': 'Facile',
    'MEDIUM': 'Moyen', 
    'HARD': 'Difficile'
  };

  // Charger les quiz au montage du composant
  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      
    
      // Récupérer tous les quiz
      const quizzesData = await quizService.getAllQuizzes();
      
      // Transformer et trier les données
      const formattedQuizzes = quizzesData
        .map(quiz => ({
          id: quiz.id,
          title: quiz.title || 'Quiz sans titre',
          description: quiz.description || 'Aucune description',
          subject: quiz.subject || 'Non spécifié',
          niveau: quiz.niveau || 'Non spécifié',
          difficulty: quiz.difficulty || 'EASY',
          timeLimit: quiz.timeLimit || 30,
          isAIGenerated: quiz.isAIGenerated || false,
          createdAt: quiz.createdAt ? new Date(quiz.createdAt) : new Date(0),
          updatedAt: quiz.updatedAt ? new Date(quiz.updatedAt) : new Date(0),
          // Formatage de la date pour l'affichage
          createdAtFormatted: quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString('fr-FR') : 'Non spécifié',
          updatedAtFormatted: quiz.updatedAt ? new Date(quiz.updatedAt).toLocaleDateString('fr-FR') : 'Non spécifié',
          questions: quiz.questionCount || 0,
          attempts: quiz.attempts || 0,
          averageScore: quiz.averageScore || 0,
          status: quiz.isPublished ? 'active' : 'draft',
          author: quiz.creatorName || 'Auteur inconnu'
        }))
        // Trier par date de création décroissante (les plus récents en premier)
        .sort((a, b) => b.createdAt - a.createdAt);
      
      setQuizzes(formattedQuizzes);
      setFilteredQuizzes(formattedQuizzes);
      
      // Extraire les catégories uniques
      const uniqueSubjects = [...new Set(formattedQuizzes.map(quiz => quiz.subject))];
      setCategories(['all', ...uniqueSubjects]);
      
      // Extraire les difficultés uniques
      const uniqueDifficulties = [...new Set(formattedQuizzes.map(quiz => quiz.difficulty))];
      setDifficulties(['all', ...uniqueDifficulties]);
      
    } catch (error) {
      setError('Erreur lors du chargement des quiz: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des quiz
  useEffect(() => {
    let filtered = quizzes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.niveau.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category (subject)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(quiz => quiz.subject === selectedCategory);
    }

    // Filter by difficulty 
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(quiz => quiz.difficulty === selectedStatus);
    }

    setFilteredQuizzes(filtered);
  }, [searchTerm, selectedCategory, selectedStatus, quizzes]);

  const handleSelectQuiz = (quizId) => {
    setSelectedQuizzes(prev => 
      prev.includes(quizId) 
        ? prev.filter(id => id !== quizId)
        : [...prev, quizId]
    );
  };

  const handleSelectAll = () => {
    setSelectedQuizzes(
      selectedQuizzes.length === filteredQuizzes.length 
        ? [] 
        : filteredQuizzes.map(quiz => quiz.id)
    );
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      return;
    }

    try {
      await quizService.deleteQuiz(quizId);      
      // Recharger la liste
      await loadQuizzes();
      
      // Retirer de la sélection si nécessaire
      setSelectedQuizzes(prev => prev.filter(id => id !== quizId));
      
    } catch (error) {
      alert('Erreur lors de la suppression du quiz: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuizzes.length === 0) return;
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedQuizzes.length} quiz ?`)) {
      return;
    }

    try {
      // Supprimer tous les quiz sélectionnés
      await Promise.all(selectedQuizzes.map(id => quizService.deleteQuiz(id)));
  
      
      // Recharger la liste
      await loadQuizzes();
      setSelectedQuizzes([]);
      
    } catch (error) {
      console.error(' Erreur lors de la suppression en lot:', error);
      alert('Erreur lors de la suppression des quiz: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'EASY': return 'bg-blue-100 text-blue-800';
      case 'MEDIUM': return 'bg-orange-100 text-orange-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadQuizzes}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Quiz</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/admin/quiz/add')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Quiz
              </button>
              <button
                onClick={loadQuizzes}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
              >
                <Loader className="w-4 h-4 mr-2" />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, description, sujet ou auteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'Tous les sujets' : category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulté</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty === 'all' ? 'Toutes les difficultés' : difficultyLabels[difficulty] || difficulty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Select All Checkbox */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedQuizzes.length === filteredQuizzes.length && filteredQuizzes.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Sélectionner tout</span>
          </label>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          {selectedQuizzes.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{selectedQuizzes.length} sélectionné{selectedQuizzes.length > 1 ? 's' : ''}</span>
              <button 
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>

        {/* Quiz Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${
              selectedQuizzes.includes(quiz.id) ? 'ring-2 ring-blue-500' : ''
            }`}>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedQuizzes.includes(quiz.id)}
                      onChange={() => handleSelectQuiz(quiz.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 break-words leading-tight">{quiz.title}</h3>
                      {quiz.description && quiz.description !== 'Aucune description' && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{quiz.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status and Category */}
                <div className="flex items-center space-x-2 mb-4 flex-wrap gap-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quiz.status)}`}>
                    {quiz.status === 'active' ? 'Actif' : 
                     quiz.status === 'draft' ? 'Brouillon' : 
                     quiz.status === 'archived' ? 'Archivé' : quiz.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
                    {difficultyLabels[quiz.difficulty] || quiz.difficulty}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {quiz.subject}
                  </span>
                  {quiz.isAIGenerated && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                      IA
                    </span>
                  )}
                </div>

                {/* Level */}
                <div className="mb-4">
                  <span className="text-sm text-gray-600">Niveau: <strong>{quiz.niveau}</strong></span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{quiz.questions} questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{quiz.timeLimit} min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{quiz.attempts} tentatives</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{quiz.averageScore}% moy.</span>
                  </div>
                </div>

                {/* Author and Date */}
                <div className="text-sm text-gray-500 mb-4">
                  <p>Par {quiz.author}</p>
                  <p className="flex items-center mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Créé le {quiz.createdAtFormatted}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => navigate(`/admin/quiz-preview/${quiz.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" 
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/quiz/${quiz.id}/edit`)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg" 
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" 
                      title="Dupliquer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg" 
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredQuizzes.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun quiz trouvé</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' 
                ? 'Aucun quiz ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore créé de quiz.'}
            </p>
            <button 
              onClick={() => navigate('/admin/quiz/add')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer votre premier quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizManagementPage;