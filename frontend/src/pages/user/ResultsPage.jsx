
import { useState, useEffect } from 'react';
import { Trophy,Clock,Target,BookOpen,TrendingUp,Award,Calendar,BarChart3,Filter,Search,Eye,ChevronDown,Star,AlertCircle,CheckCircle,XCircle} from 'lucide-react';
import resultsService from '../../services/resultsService';
import { useAuth } from '../../auth/AuthContext';

const ResultsPage = () => {
  const { user } = useAuth();
  const userId = user?.id || 1;

  // États principaux
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // États des filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedPeriod, setSelectedPeriod] = useState('all');


  const [selectedResult, setSelectedResult] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadResults();
  }, [userId]);

  
  useEffect(() => {
    applyFilters();
  }, [results, searchTerm, filterSubject, selectedPeriod, sortBy]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await resultsService.getUserResults(userId);

      
      setResults(data);
      

      const calculatedStats = resultsService.calculateUserStats(data);
      setStats(calculatedStats);
      
    } catch (err) {
 
      setError(err.message || 'Impossible de charger les résultats');
      
      
      const mockData = getMockData();
      setResults(mockData);
      setStats(resultsService.calculateUserStats(mockData));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...results];

    
    filtered = resultsService.searchResults(filtered, searchTerm);
    if (filterSubject !== 'all') {
      filtered = filtered.filter(result => result.quiz?.subject === filterSubject);
    }
    filtered = resultsService.sortResults(filtered, sortBy);

    setFilteredResults(filtered);
  };


  const viewResultDetails = async (resultId) => {
    try {
      setDetailLoading(true);
      setShowDetailModal(true);
      
      const detailedResult = await resultsService.getResultById(resultId);
      setSelectedResult(detailedResult);
      
    } catch (err) {
      alert('Impossible de récupérer les détails : ' + err.message);
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (percentage) => {
    if (percentage >= 90) return 'bg-green-100';
    if (percentage >= 80) return 'bg-blue-100';
    if (percentage >= 70) return 'bg-yellow-100';
    if (percentage >= 60) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      'EASY': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HARD': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'EASY': 'Facile',
      'MEDIUM': 'Moyen',
      'HARD': 'Difficile'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[difficulty] || 'bg-gray-100 text-gray-800'}`}>
        {labels[difficulty] || difficulty}
      </span>
    );
  };

  const subjects = [...new Set(results.map(r => r.quiz?.subject).filter(Boolean))];

  const DetailModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Détails du Résultat</h2>
            <button
              onClick={() => {
                setShowDetailModal(false);
                setSelectedResult(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {detailLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Chargement des détails...</p>
          </div>
        ) : selectedResult ? (
          <div className="p-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedResult.quiz?.title}</h3>
                  <p className="text-gray-600">{selectedResult.quiz?.subject}</p>
                </div>
                {selectedResult.quiz?.difficulty && getDifficultyBadge(selectedResult.quiz.difficulty)}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(selectedResult.percentage)}`}>
                    {selectedResult.percentage?.toFixed(1)}%
                  </div>
                  <p className="text-gray-600 text-sm">Score Final</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedResult.score}/{selectedResult.total}
                  </div>
                  <p className="text-gray-600 text-sm">Bonnes Réponses</p>
                </div>
        
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {formatDate(selectedResult.takenAt)}
                  </div>
                  <p className="text-gray-600 text-sm">Date</p>
                </div>
              </div>
            </div>

            {/* Réponses détaillées */}
            {selectedResult.answers && selectedResult.answers.length > 0 ? (
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Réponses Détaillées ({selectedResult.answers.length} questions)
                </h4>
                
                <div className="space-y-4">
                  {selectedResult.answers.map((answer, index) => (
                    <div
                      key={answer.questionId || index}
                      className={`border-l-4 p-4 rounded-lg ${
                        answer.isCorrect 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-red-400 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h5 className="font-medium text-gray-900 flex-1">
                          Question {index + 1}: {answer.question || 'Question sans texte'}
                        </h5>
                        <div className="flex items-center ml-4">
                          {answer.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Votre réponse :</p>
                          <p className={`p-2 rounded ${
                            answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {answer.selectedAnswer || 'Aucune réponse'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Réponse correcte :</p>
                          <p className="p-2 rounded bg-green-100 text-green-800">
                            {answer.correctAnswer}
                          </p>
                        </div>
                      </div>
                      
                      {answer.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <p className="font-medium text-blue-900 text-sm mb-1">Explication :</p>
                          <p className="text-blue-800 text-sm">{answer.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune réponse détaillée disponible pour ce résultat.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">Impossible de charger les détails du résultat.</p>
          </div>
        )}
      </div>
    </div>
  )

  // Erreur
  if (error && results.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-4">Erreur de Chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadResults}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
            
            </div>

          </div>

          {/* Statistiques générales */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-lg p-3 mr-4">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</div>
                    <div className="text-gray-600 text-sm">Quiz complétés</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-lg p-3 mr-4">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.averageScore.toFixed(1)}%
                    </div>
                    <div className="text-gray-600 text-sm">Score moyen</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 rounded-lg p-3 mr-4">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.bestScore}%</div>
                    <div className="text-gray-600 text-sm">Meilleur score</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-lg p-3 mr-4">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalCorrect}/{stats.totalQuestions}
                    </div>
                    <div className="text-gray-600 text-sm">Total correct</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {stats && stats.subjectAverages.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance par matière
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.subjectAverages.map((subject, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                      <span className={`font-bold ${getScoreColor(subject.average)}`}>
                        {subject.average.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(subject.average, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {subject.count} quiz • {subject.totalCorrect}/{subject.totalQuestions} bonnes réponses
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Titre du quiz..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Matière
              </label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les matières</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Période
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toute la période</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="semester">Ce semestre</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ChevronDown className="w-4 h-4 inline mr-1" />
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date-desc">Date (récent)</option>
                <option value="date-asc">Date (ancien)</option>
                <option value="score-desc">Score (élevé)</option>
                <option value="score-asc">Score (faible)</option>
                <option value="title-asc">Titre (A-Z)</option>
                <option value="subject-asc">Matière (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des résultats */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
              <span>Résultats des Quiz ({filteredResults.length})</span>
              {filteredResults.length !== results.length && (
                <span className="text-sm text-gray-500 font-normal">
                  {filteredResults.length} sur {results.length} affichés
                </span>
              )}
            </h3>
          </div>

          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun résultat trouvé avec ces critères</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSubject('all');
                  setSelectedPeriod('all');
                }}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredResults.map((result) => (
                <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 mr-3">
                          {result.quiz?.title || 'Quiz sans titre'}
                        </h4>
                        {result.quiz?.difficulty && getDifficultyBadge(result.quiz.difficulty)}
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-sm mb-3">
                        <BookOpen className="w-4 h-4 mr-1" />
                        <span className="mr-4">{result.quiz?.subject || 'Non classé'}</span>
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="mr-4">{formatDate(result.takenAt)}</span>
                        {result.timeSpent && (
                          <>
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{formatTime(result.timeSpent)}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center">
                        <div className="flex items-center mr-6">
                          <span className="text-2xl font-bold mr-2">
                            {result.score}/{result.total}
                          </span>
                          <span className="text-gray-600">questions</span>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBackground(result.percentage)}`}>
                          <span className={getScoreColor(result.percentage)}>
                            {result.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        {result.percentage >= 90 ? (
                          <Star className="w-6 h-6 text-yellow-500" />
                        ) : result.percentage >= 80 ? (
                          <Award className="w-6 h-6 text-blue-500" />
                        ) : result.percentage >= 70 ? (
                          <Trophy className="w-6 h-6 text-green-500" />
                        ) : (
                          <Target className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      
                      <button
                        onClick={() => viewResultDetails(result.id)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails */}
      {showDetailModal && <DetailModal />}
    </div>
  );
};

export default ResultsPage;