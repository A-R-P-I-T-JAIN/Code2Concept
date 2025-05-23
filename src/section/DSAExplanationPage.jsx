import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import ExplanationSection from './ExplanationSection';
import VideoSection from './VideoSection';

const DSAExplanationPage = ({ questionData, onBack }) => {
  console.log("recieved questionData:",questionData);
  
  const [activeApproach, setActiveApproach] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  
  const { approaches, title } = questionData;

  return (
    <div className="min-h-screen via-slate-800 to-slate-700 text-white">
     
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Search</span>
            </button>
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex items-center gap-2">
              
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-200px)]"
        >
          <ExplanationSection 
            approaches={approaches}
            activeApproach={activeApproach}
            setActiveApproach={setActiveApproach}
          />
          
          <VideoSection 
            approach={approaches[activeApproach]}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default DSAExplanationPage;