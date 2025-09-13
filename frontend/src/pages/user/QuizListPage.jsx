import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import QuizCard from '../../components/QuizCard';
import quizService from '../../services/quizService';
import { authService } from '../../services/authService';

const QuizListPage = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const userLevel = authService.getCurrentUserLevel();
  const isStudent = authService.isStudent();

  const filterQuizzesByLevel = (quizzes) => {
    const userLevel = authService.getCurrentUserLevel();
    const isStudent = authService.isStudent();
    
    console.log('Filtrage par niveau:', { userLevel, isStudent, totalQuizzes: quizzes.length });
    
    if (!isStudent) {
      return quizzes;
    }
    
    if (!userLevel) {
      return quizzes.filter(quiz => 
        !quiz.niveau || 
        quiz.niveau === 'Tous niveaux' || 
        quiz.niveau === 'All' ||
        quiz.niveau === '' ||
        quiz.niveau === null
      );
    }
    
    // Filtrer les quiz par niveau scolaire exact
    const filtered = quizzes.filter(quiz => {
      const quizLevel = quiz.niveau;
      
      // Cas où le quiz n'a pas de niveau spécifique (accessible à tous)
      if (!quizLevel || quizLevel === 'Tous niveaux' || quizLevel === 'All' || quizLevel === '') {
        return true;
      }
      
      // Correspondance exacte du niveau
      return quizLevel === userLevel;
    });
    
    console.log(`Quiz filtrés pour le niveau "${userLevel}":`, filtered.length, 'sur', quizzes.length);
    return filtered;
  };

  // Chargement initial des quiz depuis l'API
  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Utilisez le service du premier fichier qui récupère maintenant les questions
        const data = await quizService.getAllQuizzes();
        console.log('Quiz récupérés avec questions:', data);
        
        // Transformation des données pour correspondre au format attendu
        const transformedQuizzes = data.map(quiz => ({
          id: quiz.id,
          title: quiz.title,
          subject: quiz.subject,
          questions: quiz.numberOfQuestions || quiz.questions?.length || 0,
          duration: quiz.timeLimit || 30,
          difficulty: quiz.difficulty || 'EASY',
          niveau: quiz.niveau,
          isAIGenerated: quiz.isAIGenerated,
          createdAt: quiz.createdAt,
          creatorId: quiz.creatorId,
          questionsData: quiz.questions || []
        }));

        // ✅ CORRECTION : Appliquer le filtrage par niveau AVANT de définir les états
        const levelFilteredQuizzes = filterQuizzesByLevel(transformedQuizzes);
        
        console.log('Quiz après filtrage par niveau:', levelFilteredQuizzes);
        
        setQuizzes(levelFilteredQuizzes);
        setFilteredQuizzes(levelFilteredQuizzes);
      } catch (err) {
        console.error('Erreur lors du chargement des quiz:', err);
        setError('Impossible de charger les quiz. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [userLevel, isStudent]);

  // Filtrage des quiz par recherche et critères
  useEffect(() => {
    let filtered = quizzes;

    // Recherche par titre ou matière
    if (searchTerm) {
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par matière
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(quiz => quiz.subject === selectedSubject);
    }

    // Filtre par difficulté
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(quiz => 
        quiz.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    setFilteredQuizzes(filtered);
  }, [searchTerm, selectedSubject, selectedDifficulty, quizzes]);

  // Gestion de la suppression d'un quiz
  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      return;
    }

    try {
      await quizService.deleteQuiz(quizId);
      
      // Mise à jour de l'état local
      const updatedQuizzes = quizzes.filter(quiz => quiz.id !== quizId);
      setQuizzes(updatedQuizzes);
      setFilteredQuizzes(updatedQuizzes.filter(quiz => {
        // Réappliquer les filtres
        let matches = true;
        
        if (searchTerm) {
          matches = matches && (
            quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quiz.subject.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (selectedSubject !== 'all') {
          matches = matches && quiz.subject === selectedSubject;
        }
        
        if (selectedDifficulty !== 'all') {
          matches = matches && quiz.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
        }
        
        return matches;
      }));
      
      alert('Quiz supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du quiz.');
    }
  };

  // Gestion de l'édition d'un quiz
  const handleEditQuiz = (quiz) => {
    navigate(`/admin/quiz/edit/${quiz.id}`);
  };

  // Extraction des matières et difficultés uniques
  const subjects = [...new Set(quizzes.map(quiz => quiz.subject))];
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];

  // Fonction pour formater la difficulté en français
  const formatDifficulty = (difficulty) => {
    const difficultyMap = {
      'EASY': 'Facile',
      'MEDIUM': 'Moyen',
      'HARD': 'Difficile'
    };
    return difficultyMap[difficulty?.toUpperCase()] || difficulty;
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600">Chargement des quiz...</span>
          </div>
        </div>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
              <input
                type="text"
                placeholder="Titre ou matière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Matière</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les matières</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulté</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les difficultés</option>
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {formatDifficulty(difficulty)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubject('all');
                  setSelectedDifficulty('all');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
          
          {/* ✅ AJOUT : Affichage d'informations de débogage pour l'admin */}
          {user?.role === 'admin' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Debug Info:</strong> Utilisateur connecté - Niveau: {userLevel || 'Non défini'} | 
                Rôle: {user?.role} | Quiz affichés: {filteredQuizzes.length}
              </p>
            </div>
          )}
        </div>

        {/* Grille des Quiz */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map(quiz => (
            <QuizCard 
              key={quiz.id} 
              quiz={{
                ...quiz,
                difficulty: formatDifficulty(quiz.difficulty)
              }}
              onStart={(quiz) => navigate(`/quiz/${quiz.id}`)}
              onEdit={() => handleEditQuiz(quiz)}
              onDelete={() => handleDeleteQuiz(quiz.id)}
              isAdmin={user?.role === 'admin'}
            />
          ))}
        </div>

        {/* Message si aucun quiz trouvé */}
        {filteredQuizzes.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">
              {isStudent && userLevel 
                ? `Aucun quiz trouvé pour le niveau "${userLevel}" avec ces critères`
                : 'Aucun quiz trouvé avec ces critères'
              }
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Essayez de modifier vos filtres ou contactez votre enseignant
            </p>
          </div>
        )}

        {/* Bouton pour créer un nouveau quiz (admin seulement) */}
        {user?.role === 'admin' && (
          <div className="fixed bottom-8 right-8">
            <button
              onClick={() => navigate('/admin/quiz/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors"
              title="Créer un nouveau quiz"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizListPage;