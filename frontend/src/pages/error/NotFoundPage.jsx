import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Illustration 404 */}
      <div className="relative mb-8">
        <svg
          width="500"
          height="300"
          viewBox="0 0 500 300"
          className="w-full max-w-lg h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background elements */}
          <defs>
            <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
              <circle cx="10" cy="10" r="2" fill="#e5e7eb" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="500" height="300" fill="url(#dots)"/>
          
          {/* Gear icons in background */}
          <g opacity="0.1">
            <circle cx="80" cy="60" r="25" fill="none" stroke="#6b7280" strokeWidth="3"/>
            <path d="M65,60 L95,60 M80,45 L80,75 M70,50 L90,70 M90,50 L70,70" stroke="#6b7280" strokeWidth="2"/>
            
            <circle cx="420" cy="80" r="20" fill="none" stroke="#6b7280" strokeWidth="2"/>
            <path d="M408,80 L432,80 M420,68 L420,92 M412,72 L428,88 M428,72 L412,88" stroke="#6b7280" strokeWidth="1.5"/>
            
            <circle cx="450" cy="220" r="15" fill="none" stroke="#6b7280" strokeWidth="2"/>
            <path d="M440,220 L460,220 M450,210 L450,230 M443,213 L457,227 M457,213 L443,227" stroke="#6b7280" strokeWidth="1"/>
          </g>
          
          {/* Main 404 numbers */}
          {/* Number 4 */}
          <path d="M50 120 L50 180 L50 200 L80 200 L80 220 L120 220 L120 180 L120 120 L120 100 L80 100 L80 160 L50 160 Z" 
                fill="#f97316" stroke="#ea580c" strokeWidth="2"/>
          
          {/* Number 0 */}
          <ellipse cx="200" cy="160" rx="60" ry="80" fill="#f97316" stroke="#ea580c" strokeWidth="3"/>
          <ellipse cx="200" cy="160" rx="30" ry="50" fill="#fef3c7"/>
          
          {/* Number 4 */}
          <path d="M320 120 L320 180 L320 200 L350 200 L350 220 L390 220 L390 180 L390 120 L390 100 L350 100 L350 160 L320 160 Z" 
                fill="#f97316" stroke="#ea580c" strokeWidth="2"/>
          
          {/* Characters */}
          {/* Left person */}
          <g transform="translate(40, 180)">
            {/* Body */}
            <ellipse cx="15" cy="35" rx="12" ry="20" fill="#374151"/>
            {/* Head */}
            <circle cx="15" cy="10" r="8" fill="#fbbf24"/>
            {/* Hair */}
            <path d="M8,4 Q15,0 22,4 Q20,8 15,8 Q10,8 8,4" fill="#f59e0b"/>
            {/* Arms */}
            <ellipse cx="5" cy="30" rx="4" ry="10" fill="#fbbf24" transform="rotate(-30 5 30)"/>
            <ellipse cx="25" cy="30" rx="4" ry="10" fill="#fbbf24" transform="rotate(30 25 30)"/>
            {/* Legs */}
            <ellipse cx="10" cy="50" rx="4" ry="12" fill="#374151"/>
            <ellipse cx="20" cy="50" rx="4" ry="12" fill="#374151"/>
            {/* Shoes */}
            <ellipse cx="8" cy="60" rx="6" ry="3" fill="#f97316"/>
            <ellipse cx="22" cy="60" rx="6" ry="3" fill="#f97316"/>
          </g>
          
          {/* Center person (sitting) */}
          <g transform="translate(180, 200)">
            {/* Body */}
            <ellipse cx="15" cy="20" rx="10" ry="15" fill="#1f2937"/>
            {/* Head */}
            <circle cx="15" cy="5" r="7" fill="#92400e"/>
            {/* Hair */}
            <path d="M10,0 Q15,-3 20,0 Q18,4 15,4 Q12,4 10,0" fill="#451a03"/>
            {/* Arms */}
            <ellipse cx="8" cy="18" rx="3" ry="8" fill="#92400e" transform="rotate(-20 8 18)"/>
            <ellipse cx="22" cy="18" rx="3" ry="8" fill="#92400e" transform="rotate(20 22 18)"/>
            {/* Legs (sitting) */}
            <ellipse cx="10" cy="32" rx="3" ry="8" fill="#1f2937" transform="rotate(60 10 32)"/>
            <ellipse cx="20" cy="32" rx="3" ry="8" fill="#1f2937" transform="rotate(-60 20 32)"/>
            {/* Shoes */}
            <ellipse cx="5" cy="38" rx="4" ry="2" fill="#f97316"/>
            <ellipse cx="25" cy="38" rx="4" ry="2" fill="#f97316"/>
            {/* T-shirt pattern */}
            <circle cx="12" cy="18" r="1.5" fill="#f97316"/>
            <circle cx="15" cy="22" r="1.5" fill="#f97316"/>
            <circle cx="18" cy="16" r="1.5" fill="#f97316"/>
          </g>
          
          {/* Right person */}
          <g transform="translate(380, 170)">
            {/* Body */}
            <ellipse cx="15" cy="40" rx="10" ry="25" fill="#6b7280"/>
            {/* Head */}
            <circle cx="15" cy="12" r="8" fill="#fbbf24"/>
            {/* Hair */}
            <path d="M8,6 Q15,2 22,6 L22,10 Q20,14 15,14 Q10,14 8,10 Z" fill="#451a03"/>
            {/* Arms */}
            <ellipse cx="6" cy="35" rx="4" ry="12" fill="#fbbf24" transform="rotate(-25 6 35)"/>
            <ellipse cx="24" cy="35" rx="4" ry="12" fill="#fbbf24" transform="rotate(25 24 35)"/>
            {/* Legs */}
            <ellipse cx="10" cy="60" rx="4" ry="15" fill="#fb7185"/>
            <ellipse cx="20" cy="60" rx="4" ry="15" fill="#fb7185"/>
            {/* Shoes */}
            <ellipse cx="8" cy="73" rx="6" ry="3" fill="#f97316"/>
            <ellipse cx="22" cy="73" rx="6" ry="3" fill="#f97316"/>
          </g>
        </svg>
      </div>
      
      {/* Error text */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ERROR - PAGE NOT FOUND!
        </h1>
        <p className="text-gray-600 mb-6 max-w-md">
          Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
      </div>
      
      {/* Return button */}
      <Link 
        to="/" 
        className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <Home className="h-5 w-5 mr-2" />
        retour à la page d'accueil
      </Link>
      
      {/* Additional decorative elements */}
      <div className="absolute top-10 left-10 opacity-20">
        <div className="w-16 h-16 border-4 border-orange-300 rounded-full animate-spin"></div>
      </div>
      <div className="absolute bottom-10 right-10 opacity-20">
        <div className="w-12 h-12 bg-orange-200 rounded-full animate-bounce"></div>
      </div>
      <div className="absolute top-1/4 right-20 opacity-15">
        <div className="w-8 h-8 bg-gray-300 transform rotate-45 animate-pulse"></div>
      </div>
    </div>
  );
};

export default NotFoundPage;