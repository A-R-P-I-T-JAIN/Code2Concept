import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Clock, TrendingUp, Copy, Check, ChevronRight, ChevronDown, Zap, AlertTriangle } from 'lucide-react';

const ExplanationSection = ({ approaches, activeApproach, setActiveApproach }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    complexity: true,
    prosCons: true
  });

  const copyCode = () => {
    navigator.clipboard.writeText(approaches[activeApproach].code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="bg-slate-800/70 rounded-xl border border-slate-700 overflow-hidden shadow-xl h-full">
      <div className="border-b border-slate-700 p-4 bg-slate-800/50">
        <h2 className="text-xl font-semibold mb-4">Solution Approaches</h2>
        
        <div className="flex flex-wrap gap-2">
          {approaches.map((approach, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveApproach(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeApproach === index
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {approach.title}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="p-6 overflow-y-auto h-full">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {approaches[activeApproach].title}
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
              {activeApproach === 0 ? "Basic" : activeApproach === 1 ? "Optimal" : "Alternative"}
            </span>
          </h3>
          <p className="text-gray-300 mb-4">{approaches[activeApproach].description}</p>
          
         
          <div className="mb-4">
            <button 
              onClick={() => toggleSection('complexity')}
              className="flex items-center gap-2 w-full text-left mb-2"
            >
              {expandedSections.complexity ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium">Complexity Analysis</span>
            </button>
            
            <AnimatePresence>
              {expandedSections.complexity && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0, height: 0 },
                    visible: { opacity: 1, height: 'auto' }
                  }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="text-xs text-gray-400">Time</span>
                        <span className="block text-sm font-mono">{approaches[activeApproach].timeComplexity}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <div>
                        <span className="text-xs text-gray-400">Space</span>
                        <span className="block text-sm font-mono">{approaches[activeApproach].spaceComplexity}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

         
          <div className="mb-6">
            <button 
              onClick={() => toggleSection('prosCons')}
              className="flex items-center gap-2 w-full text-left mb-2"
            >
              {expandedSections.prosCons ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium">Advantages & Limitations</span>
            </button>
            
            <AnimatePresence>
              {expandedSections.prosCons && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0, height: 0 },
                    visible: { opacity: 1, height: 'auto' }
                  }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-900/20 rounded-lg p-3 border border-green-800/50">
                      <h4 className="font-medium text-green-400 mb-2 flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        Pros
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {approaches[activeApproach].pros.map((pro, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-400">✓</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-900/20 rounded-lg p-3 border border-red-800/50">
                      <h4 className="font-medium text-red-400 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Cons
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {approaches[activeApproach].cons.map((con, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-400">✗</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

     
        <div className="bg-slate-900/80 rounded-lg overflow-hidden border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between bg-slate-800 px-4 py-2 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Java Solution</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyCode}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-slate-700/50 px-3 py-1 rounded-md"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </motion.button>
          </div>
          <pre className="p-4 text-sm overflow-x-auto bg-gradient-to-b from-slate-900 to-slate-900/80">
            <code className="text-gray-300 font-mono">{approaches[activeApproach].code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ExplanationSection;