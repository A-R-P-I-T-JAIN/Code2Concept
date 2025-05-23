import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, BookOpen, Zap, ChevronDown, ChevronRight, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { useVideo } from '../context/VideoContext';

const VideoSection = ({ approach, isPlaying, togglePlay }) => {
  const [expandedSections, setExpandedSections] = useState({
    videoDetails: true
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const { getVideoUrl, setVideoUrl } = useVideo();

  useEffect(() => {
    const fetchVideoUrl = async () => {
      // Check if we already have the URL cached
      const cachedUrl = getVideoUrl(approach.title);
      if (cachedUrl) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/getAnimation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ approach }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch video URL');
        }

        const data = await response.json();
        // Cache the URL
        setVideoUrl(approach.title, data.animationUrl);
      } catch (error) {
        console.error('Error fetching video URL:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoUrl();
  }, [approach, getVideoUrl, setVideoUrl]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    togglePlay();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const videoUrl = getVideoUrl(approach.title);

  return (
    <div className="bg-[#8B7355] rounded-xl border border-[#2C2522] overflow-hidden shadow-xl h-full">
      <div className="border-b border-[#2C2522] p-4 bg-[#8B7355]">
        <h2 className="text-xl font-semibold text-[#e6ddd6]">Interactive Explanation</h2>
      </div>
      
      <div className="p-6 h-full flex flex-col bg-[#C4B5A5]">
        <div className="relative mb-6" ref={videoContainerRef}>
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-[#2C2522] rounded-lg aspect-video overflow-hidden border border-[#2C2522] cursor-pointer"
            onClick={handlePlayPause}
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#2C2522]/90">
                <Loader2 className="w-8 h-8 text-[#8B7355] animate-spin" />
                <span className="ml-2 text-[#8B7355]">Loading animation...</span>
              </div>
            ) : videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                loop
                muted
                poster="/video-poster.jpg"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#2C2522]/90">
                <span className="text-[#8B7355]">Failed to load animation</span>
              </div>
            )}
            
            {!isPlaying && !isLoading && videoUrl && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-[#2C2522]/80"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-[#8B7355] rounded-full flex items-center justify-center mb-4 mx-auto hover:bg-[#6B574A] transition-colors">
                    <Play className="w-8 h-8 text-[#e6ddd6] ml-1" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-[#e6ddd6]">Step-by-Step Walkthrough</h3>
                </div>
              </motion.div>
            )}
          </motion.div>
          
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
            {isPlaying && !isLoading && videoUrl && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#2C2522]/80 rounded-full p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
              >
                <Pause className="w-5 h-5 text-[#e6ddd6]" />
              </motion.button>
            )}
            
            {!isLoading && videoUrl && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-[#2C2522]/80 rounded-full p-2 ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-[#e6ddd6]" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-[#e6ddd6]" />
                )}
              </motion.button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {!isLoading && videoUrl && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayPause}
                className="flex items-center gap-2 bg-[#6B574A] hover:bg-[#8B7355] px-4 py-2 rounded-lg transition-colors shadow-md text-[#e6ddd6]"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Explanation</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Play Explanation</span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          <div>
            <button 
              onClick={() => toggleSection('videoDetails')}
              className="flex items-center gap-2 w-full text-left mb-2 text-[#2C2522]"
            >
              {expandedSections.videoDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium">Video Details</span>
            </button>
            
            <AnimatePresence>
              {expandedSections.videoDetails && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0, height: 0 },
                    visible: { opacity: 1, height: 'auto' }
                  }}
                  className="overflow-hidden space-y-4"
                >
                  <div className="bg-[#8B7355]/20 rounded-lg p-4 border border-[#2C2522]">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-[#2C2522]">
                      <BookOpen className="w-4 h-4" />
                      What you'll learn:
                    </h4>
                    <ul className="text-sm text-[#2C2522] space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-[#6B574A]">•</span>
                        <span>Problem breakdown and analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#6B574A]">•</span>
                        <span>Step-by-step solution walkthrough</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#6B574A]">•</span>
                        <span>Time and space complexity analysis</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-[#8B7355]/20 rounded-lg p-4 border border-[#2C2522]">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-[#2C2522]">
                      <Zap className="w-4 h-4" />
                      Key Concepts:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {approach.concepts.map((concept, index) => (
                        <motion.span
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          className="bg-[#6B574A] text-[#e6ddd6] px-2 py-1 rounded text-xs"
                        >
                          {concept}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSection;