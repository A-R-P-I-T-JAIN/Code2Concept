import { useState } from 'react';
import { Sparkles, Link } from 'lucide-react';

const SearchInput = ({ onGenerate, disabled }) => {
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#2C2522] border border-[#8B7355] rounded-xl p-4 gap-4 transition-all shadow-lg">
          <div className="flex items-center text-[#8B7355]">
            <Link className="w-5 h-5 mr-2 sm:mr-3" />
          </div>
          <input
            type="text"
            placeholder="Paste Leetcode/GFG question URL..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            className="flex-1 bg-transparent text-[#E6D5B8] placeholder-[#8B7355] text-base sm:text-lg font-medium disabled:opacity-50 outline-none"
          />
          <button 
            onClick={handleGenerate}  
            disabled={!inputValue.trim() || disabled}
            className="bg-[#8B7355] hover:bg-[#A67B5B] text-[#E6D5B8] px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm sm:text-base">Generate</span>
          </button>
        </div>
        <p className="text-xs sm:text-sm text-[#8B7355] mt-2 text-center font-medium">
          Example: https://leetcode.com/problems/two-sum/
        </p>
      </div>
      <div className="flex items-center justify-center gap-4 mt-8">
        <div className="h-px bg-[#8B7355]/30 flex-1"></div>
        <p className="text-lg text-[#E6D5B8] font-medium">or</p>
        <div className="h-px bg-[#8B7355]/30 flex-1"></div>
      </div>
    </div>
  );
};

export default SearchInput;
