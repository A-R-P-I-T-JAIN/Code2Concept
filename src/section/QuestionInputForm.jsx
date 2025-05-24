import { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const QuestionInputForm = ({ onGenerate, disabled }) => {
  const [questionText, setQuestionText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (questionText.trim()) {
      console.log('Question submitted:', questionText);
      onGenerate({ url: questionText, type: 'url' });
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [questionText]);

  const placeholderText = `Example:

Problem: Two Sum
Given an array of integers nums and an integer target...

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]

Constraints:
2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9`;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto ">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          disabled={disabled}
          className="mx-auto w-full sm:w-auto px-6 py-3 bg-[#A39179] hover:bg-[#B7A48C] text-[#1C1917] rounded-lg font-medium text-base sm:text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <Sparkles className="w-5 h-5" />
          <span>Generate DSA Explanation</span>
        </button>
      ) : (
        <div className="bg-[#2C2522] border border-[#8B7355] p-8 rounded-xl  shadow-[0_0_15px_rgba(163,145,121,0.1)]">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <h2 className="text-[#A39179] mb-4 text-2xl font-medium tracking-wide">
                Paste your complete DSA question:
              </h2>
              <div className="bg-[#1C1917] rounded-xl border border-[#2D2522] overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
                <textarea
                  ref={textareaRef}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={placeholderText}
                  className="w-full bg-[#1C1917] p-6 text-[#A39179] text-[#E6D5B8] placeholder-[#8B7355] focus:outline-none focus:ring-1 focus:ring-[#A39179] transition-all resize-none overflow-hidden min-h-[400px] max-h-[400px] text-base  leading-relaxed sm:text-lg font-medium disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-lg bg-[#1C1917] text-[#A39179] hover:bg-[#2D2522] transition-colors border border-[#2D2522] hover:border-[#A39179] shadow-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!questionText.trim()}
                className="bg-[#8B7355] hover:bg-[#A67B5B] text-[#E6D5B8] px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate Video</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default QuestionInputForm;
