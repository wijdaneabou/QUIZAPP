import { FileText, Clock, Play, Edit, Trash2 } from 'lucide-react';

const QuizCard = ({ quiz, onStart, onEdit, onDelete, isAdmin }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'facile': return 'bg-green-100 text-green-800';
      case 'moyen': return 'bg-yellow-100 text-yellow-800';
      case 'difficile': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group h-full flex flex-col">
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
           <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#CB7206] transition-colors line-clamp-2 min-h-[3.5rem]">
              {quiz.title}
            </h3>
            <p className="text-gray-600 mb-3">{quiz.subject}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(quiz.difficulty)}`}>
            {quiz.difficulty}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            {quiz.questions} questions
          </div>
          <div className="flex items-center mt-auto">
            <Clock className="h-4 w-4 mr-1" />
            {quiz.duration} min
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onStart(quiz)}
            style={{ backgroundColor: '#070C9C' }}
            className="flex-1 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center hover:bg-[#F78B08]"
          >
            <Play className="h-4 w-4 mr-2" />
            Commencer
          </button>
          
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(quiz)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(quiz.id)}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCard;