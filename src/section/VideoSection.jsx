import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, BookOpen, Zap, ChevronDown, ChevronRight, Maximize2, Minimize2, Loader2, Volume2, VolumeX, RotateCcw, SkipForward } from 'lucide-react';
import { useVideo } from '../context/VideoContext';

const VideoSection = ({ approach, isPlaying, togglePlay }) => {
  const [expandedSections, setExpandedSections] = useState({
    videoDetails: true
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const progressRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  
  const { getVideoUrl, setVideoUrl, isVideoRequested, setVideoRequested } = useVideo();
  
  console.log("approach:", approach);

  // Memoize the fetch function to prevent recreation on every render
  const fetchVideoUrl = useCallback(async () => {
    // Check if we already have the URL cached
    const cachedUrl = getVideoUrl(approach.title);
    if (cachedUrl) {
      setIsLoading(false);
      return;
    }

    // Prevent multiple simultaneous requests for the same approach
    if (isVideoRequested(approach.title)) {
      return;
    }

    try {
      setIsLoading(true);
      setVideoRequested(approach.title, true);
      
      console.log('Fetching video URL for approach:', approach.title);
      
      const response = await fetch('http://localhost:5000/api/getAnimation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approach }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch video URL: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received video data:', data);
      
      // Cache the URL - use the correct property name
      if (data.videoUrl) {
        const fullUrl = `http://localhost:5000${data.videoUrl}`;
        setVideoUrl(approach.title, fullUrl);
        console.log('Video URL cached:', fullUrl);
      } else {
        throw new Error('No video URL in response');
      }
    } catch (error) {
      console.error('Error fetching video URL:', error);
      setVideoRequested(approach.title, false); // Reset on error to allow retry
    } finally {
      setIsLoading(false);
    }
  }, [approach.title, approach, getVideoUrl, setVideoUrl, isVideoRequested, setVideoRequested]);

  useEffect(() => {
    // Check if we have cached URL first
    const cachedUrl = getVideoUrl(approach.title);
    if (cachedUrl) {
      setIsLoading(false);
    } else {
      fetchVideoUrl();
    }
  }, [approach.title, fetchVideoUrl, getVideoUrl]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [videoRef.current]);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && !isHovering && !isDragging) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isHovering, isDragging]);

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

  const handleProgressClick = (e) => {
    e.stopPropagation();
    if (!progressRef.current || !videoRef.current || duration === 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
  };

  const handleProgressMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleProgressMouseMove = (e) => {
    if (!isDragging || !progressRef.current || !videoRef.current || duration === 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const dragX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(dragX / rect.width, 1));
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
  };

  const handleProgressMouseUp = () => {
    setIsDragging(false);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
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

  // Add global mouse event listeners for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleProgressMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleProgressMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const videoUrl = getVideoUrl(approach.title);
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-800/70 rounded-xl border border-slate-700 overflow-hidden shadow-xl h-full">
      <div className="border-b border-slate-700 p-4 bg-slate-800/50">
        <h2 className="text-xl font-semibold">Interactive Explanation</h2>
      </div>
      
      <div className="p-6 h-full flex flex-col">
        <div 
          className="relative mb-6" 
          ref={videoContainerRef}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-slate-900/80 rounded-lg aspect-video overflow-hidden border border-slate-700 cursor-pointer relative"
            onClick={handlePlayPause}
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-2 text-blue-500">Loading animation...</span>
              </div>
            ) : videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                poster="/video-poster.jpg"
                onLoadStart={() => console.log('Video loading started')}
                onLoadedData={() => console.log('Video loaded successfully')}
                onError={(e) => console.error('Video error:', e)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                <span className="text-red-500">Failed to load animation</span>
              </div>
            )}
            
            {!isPlaying && !isLoading && videoUrl && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 z-10"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-700/80 rounded-full flex items-center justify-center mb-4 mx-auto hover:bg-slate-600/80 transition-colors">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Step-by-Step Walkthrough</h3>
                </div>
              </motion.div>
            )}

            {/* Enhanced Video Controls */}
            <AnimatePresence>
              {(showControls || !isPlaying) && !isLoading && videoUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 z-20"
                >
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div 
                      ref={progressRef}
                      className="w-full h-2 bg-white/20 rounded-full cursor-pointer relative group hover:h-3 transition-all"
                      onClick={handleProgressClick}
                      onMouseDown={handleProgressMouseDown}
                    >
                      <div 
                        className="h-full bg-blue-500 rounded-full relative transition-all duration-150"
                        style={{ width: `${progressPercentage}%` }}
                      >
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mr-1.5 shadow-lg" />
                      </div>
                      {/* Hover preview */}
                      <div className="absolute top-0 h-full w-full opacity-0 hover:opacity-20 bg-white rounded-full transition-opacity" />
                    </div>
                    <div className="flex justify-between text-xs text-white/70 mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        className="bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPause();
                        }}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>

                      <button
                        className="bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestart();
                        }}
                        title="Restart"
                      >
                        <RotateCcw className="w-4 h-4 text-white" />
                      </button>

                      <button
                        className="bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkipForward();
                        }}
                        title="Skip 10s"
                      >
                        <SkipForward className="w-4 h-4 text-white" />
                      </button>

                      {/* Volume Controls */}
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          className="bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                          }}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-white" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    </div>

                    <button
                      className="bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                      }}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-5 h-5 text-white" />
                      ) : (
                        <Maximize2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {!isLoading && videoUrl && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayPause}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg transition-colors shadow-md"
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
            
            {!isLoading && videoUrl && duration > 0 && (
              <div className="text-sm text-gray-400">
                Duration: {formatTime(duration)}
              </div>
            )}
          </div>

          <div>
            <button 
              onClick={() => toggleSection('videoDetails')}
              className="flex items-center gap-2 w-full text-left mb-2"
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
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      What you'll learn:
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Problem breakdown and analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Step-by-step solution walkthrough</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        <span>Time and space complexity analysis</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Key Concepts:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {approach.concepts.map((concept, index) => (
                        <motion.span
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs"
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

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default VideoSection;