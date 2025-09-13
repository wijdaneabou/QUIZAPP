import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminResultsPage = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    loadResults();
    loadStatistics();
    loadQuizzes();
  }, []);

  // Fonction utilitaire pour faire les appels API
  const makeApiCall = async (url, errorMessage) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Vérifier si la réponse est en JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Réponse non-JSON reçue. Vérifiez que l'endpoint ${url} existe.`);
      }

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorData}`);
      }
    } catch (err) {
      console.error(`${errorMessage}:`, err);
      throw err;
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      // Essayer avec l'URL complète si nécessaire
      const data = await makeApiCall(
        'http://localhost:8080/api/admin/results/all', 
        'Erreur lors du chargement des résultats'
      );
      setResults(data || []);
      setError('');
    } catch (err) {
      setError(`Erreur de chargement des résultats: ${err.message}`);
      // En cas d'erreur, définir des données par défaut
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await makeApiCall(
        'http://localhost:8080/api/admin/results/statistics',
        'Erreur lors du chargement des statistiques'
      );
      setStatistics(data || {});
    } catch (err) {
      console.error('Erreur statistiques:', err.message);
      // Statistiques par défaut en cas d'erreur
      setStatistics({
        totalResults: 0,
        totalStudents: 0,
        totalQuizzes: 0,
        averageScore: 0
      });
    }
  };

  const loadQuizzes = async () => {
    try {
      const data = await makeApiCall(
        'http://localhost:8080/api/admin/quiz',  // Changé de 'quizzes' vers 'quiz'
        'Erreur lors du chargement des quiz'
      );
      setQuizzes(data || []);
    } catch (err) {
      console.error('Erreur quiz:', err.message);
      setQuizzes([]);
    }
  };

  const filterResultsByQuiz = async (quizId) => {
    if (!quizId) {
      loadResults();
      return;
    }

    try {
      const data = await makeApiCall(
        `http://localhost:8080/api/admin/results/quiz/${quizId}`,
        'Erreur lors du filtrage'
      );
      setResults(data || []);
      setError('');
    } catch (err) {
      setError(`Erreur lors du filtrage: ${err.message}`);
    }
  };

  const deleteResult = async (resultId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce résultat ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/results/${resultId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setResults(results.filter(r => r.id !== resultId));
        setError('');
      } else {
        const errorText = await response.text();
        setError(`Erreur lors de la suppression: ${errorText}`);
      }
    } catch (err) {
      setError(`Erreur de connexion: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
         <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </button>
      </div>


      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Résultats</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalResults || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
            <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Étudiants</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalStudents || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            </div>
        </div>
       </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Quiz Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalQuizzes || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Score Moyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.averageScore ? `${statistics.averageScore.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par Quiz
            </label>
            <select
              value={selectedQuiz}
              onChange={(e) => {
                setSelectedQuiz(e.target.value);
                filterResultsByQuiz(e.target.value);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les quiz</option>
              {quizzes.map(quiz => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title || `Quiz ${quiz.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
            <button
              onClick={() => {
                setSelectedQuiz('');
                loadResults();
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200"
            >
              Réinitialiser
            </button>
            <button
              onClick={loadResults}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tableau des résultats */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {results.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
            </svg>
            <p className="mt-4 text-lg text-gray-600">Aucun résultat trouvé</p>
            <p className="mt-2 text-sm text-gray-500">
              Les résultats apparaîtront ici une fois que les étudiants auront commencé à passer des quiz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Étudiant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pourcentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => {
                  const percentage = result.maxScore > 0 
                    ? ((result.score / result.maxScore) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {result.studentName || 'Nom inconnu'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.studentEmail || 'Email inconnu'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{result.quizTitle || 'Titre inconnu'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {result.score || 0} / {result.maxScore || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(percentage)}`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(result.completedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteResult(result.id)}
                          className="text-red-600 hover:text-red-900 transition duration-200"
                          title="Supprimer ce résultat"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResultsPage;