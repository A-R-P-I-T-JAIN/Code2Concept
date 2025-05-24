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
    <div className="min-h-screen bg-[#] text-[#2C2522] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(#8B7355 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>
     
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#e6ddd6] backdrop-blur-sm border-b border-[#8B7355] sticky top-0 z-10"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#2C2522] hover:text-[#8B7355] transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Search</span>
            </button>
            <h1 className="text-2xl font-bold text-[#2C2522]">{title}</h1>
            <div className="flex items-center gap-2">
              
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-8 relative ">
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