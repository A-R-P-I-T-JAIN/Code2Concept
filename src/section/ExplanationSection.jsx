import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Clock, TrendingUp, Copy, Check, ChevronRight, ChevronDown, Zap, AlertTriangle } from 'lucide-react';

const ExplanationSection = ({ approaches, activeApproach, setActiveApproach }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    complexity: true,
    prosCons: true
  });
  const [activeLanguage, setActiveLanguage] = useState('javaCode'); // Default language

  const copyCode = () => {
    navigator.clipboard.writeText(approaches[activeApproach].code[activeLanguage]);
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
    <div className="bg-[#8B7355] rounded-xl border border-[#2C2522] overflow-hidden shadow-xl h-full flex flex-col">
      <div className="border-b border-[#2C2522] p-4 bg-[#8B7355] flex-shrink-0">
        <h2 className="text-xl font-semibold mb-4 text-[#e6ddd6]">Solution Approaches</h2>
        
        <div className="flex flex-wrap gap-2">
          {approaches.map((approach, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveApproach(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeApproach === index
                  ? 'bg-[#2C2522] text-[#e6ddd6]'
                  : 'bg-[#6B574A] text-[#e6ddd6]'
              }`}
            >
              {approach.title}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="p-6 overflow-y-auto bg-[#C4B5A5] flex-1">
        <div className="max-w-full">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-[#2C2522]">
            {approaches[activeApproach].title}
            <span className="text-xs bg-[#2C2522] text-[#e6ddd6] px-2 py-1 rounded-full">
              {activeApproach === 0 ? "Basic" : activeApproach === 1 ? "Optimal" : "Alternative"}
            </span>
          </h3>
          <p className="text-[#2C2522] mb-4">{approaches[activeApproach].description}</p>
          
          {/* Complexity Section */}
          <div className="mb-4">
            <button 
              onClick={() => toggleSection('complexity')}
              className="flex items-center gap-2 w-full text-left mb-2 text-[#2C2522]"
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
                    <div className="flex items-center gap-2 bg-[#4A7B5A]/20 px-3 py-2 rounded-lg border border-[#4A7B5A]">
                      <Clock className="w-4 h-4 text-[#4A7B5A]" />
                      <div>
                        <span className="text-xs text-[#2C2522]">Time</span>
                        <span className="block text-sm font-mono text-[#2C2522]">{approaches[activeApproach].timeComplexity}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#7B4A4A]/20 px-3 py-2 rounded-lg border border-[#7B4A4A]">
                      <TrendingUp className="w-4 h-4 text-[#7B4A4A]" />
                      <div>
                        <span className="text-xs text-[#2C2522]">Space</span>
                        <span className="block text-sm font-mono text-[#2C2522]">{approaches[activeApproach].spaceComplexity}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pros & Cons Section */}
          <div className="mb-6">
            <button 
              onClick={() => toggleSection('prosCons')}
              className="flex items-center gap-2 w-full text-left mb-2 text-[#2C2522]"
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
                    <div className="bg-[#4A7B5A]/20 rounded-lg p-3 border border-[#4A7B5A]">
                      <h4 className="font-medium text-[#4A7B5A] mb-2 flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        Pros
                      </h4>
                      <ul className="text-sm text-[#2C2522] space-y-1">
                        {approaches[activeApproach].pros.map((pro, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-[#4A7B5A]">✓</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-[#7B4A4A]/20 rounded-lg p-3 border border-[#7B4A4A]">
                      <h4 className="font-medium text-[#7B4A4A] mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Cons
                      </h4>
                      <ul className="text-sm text-[#2C2522] space-y-1">
                        {approaches[activeApproach].cons.map((con, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-[#7B4A4A]">✗</span>
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

          {/* Code Section */}
          <div className="bg-[#2C2522] rounded-lg overflow-hidden border border-[#2C2522] shadow-lg">
            <div className="flex items-center justify-between bg-[#6B574A] px-4 py-2 border-b border-[#2C2522] sticky top-0">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#e6ddd6]" />
                <div className="flex gap-1">
                  {['javaCode', 'pythonCode', 'cppCode', 'jsCode'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLanguage(lang)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        activeLanguage === lang 
                          ? 'bg-[#2C2522] text-[#e6ddd6]'
                          : 'text-[#e6ddd6]/70 hover:bg-[#2C2522]/30'
                      }`}
                    >
                      {lang.replace('Code', '')}
                    </button>
                  ))}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyCode}
                className="flex items-center gap-2 text-sm text-[#e6ddd6]/80 hover:text-[#e6ddd6] transition-colors bg-[#2C2522]/50 px-3 py-1 rounded-md"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-[#8B7355]" />
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
            <div className="overflow-x-auto">
              <pre className="p-4 text-sm min-h-[200px] max-h-[400px] overflow-y-auto">
                <code className="text-[#e6ddd6] font-mono whitespace-pre-wrap break-words">
                  {approaches[activeApproach].code[activeLanguage]}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplanationSection;