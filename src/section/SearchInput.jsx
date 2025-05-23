import { useState } from 'react';
import { Sparkles, Link } from 'lucide-react';

const SearchInput = ({ onGenerate }) => {
  const [inputValue, setInputValue] = useState('');

  const handleGenerate = () => {
    if (inputValue.trim()) {
      console.log("submitted URL:", inputValue);
      onGenerate({ url: inputValue, type: 'url' });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto mb-12">
      <div className="relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-4 gap-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
          <div className="flex items-center text-gray-400">
            <Link className="w-5 h-5 mr-2 sm:mr-3" />
          </div>
          <input
            type="text"
            placeholder="Paste Leetcode/GFG question URL..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-base sm:text-lg"
          />
          <button 
            onClick={handleGenerate}  
            disabled={!inputValue.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
            title="Generate Video"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm sm:text-base">Generate</span>
          </button>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">
          Example: https://leetcode.com/problems/two-sum/
        </p>
      </div>
      <p className="text-lg sm:text-2xl text-white mt-4 text-center">or</p>
    </div>
  );
};

export default SearchInput;
