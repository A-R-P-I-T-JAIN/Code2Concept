import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, BookOpen, Zap, ChevronDown, ChevronRight, Maximize2, Minimize2, Loader2, Volume2, VolumeX, RotateCcw, SkipForward, SkipBack } from 'lucide-react';
import { useVideo } from '../context/VideoContext';

const VideoSection = ({ approach, isPlaying, togglePlay }) => {
  const [expandedSections, setExpandedSections] = useState({
    videoDetails: true
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  
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
      setError(null);
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.statusText}`);
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
      setError(error.message);
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
      setIsBuffering(false);
    };

    const handleLoadStart = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleError = (e) => {
      console.error('Video error:', e);
      setError('Failed to load video. Please try again.');
      setIsBuffering(false);
    };

    const handleEnded = () => {
      togglePlay();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoRef.current, togglePlay]);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && !isHovering && !isDragging && !isFullscreen) {
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
  }, [isPlaying, isHovering, isDragging, isFullscreen]);

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
        videoRef.current.play().catch(e => {
          console.error('Error playing video:', e);
          setError('Unable to play video. Please try again.');
        });
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
      if (!isPlaying) {
        handlePlayPause();
      }
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, currentTime - 10);
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

  const retryLoading = () => {
    setError(null);
    setVideoRequested(approach.title, false);
    fetchVideoUrl();
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
    <div className="bg-[#8B7355] rounded-xl border border-[#2C2522] overflow-hidden shadow-xl h-full">
      <div className="border-b border-[#2C2522] p-4 bg-[#8B7355]">
        <h2 className="text-xl font-semibold text-[#e6ddd6]">Interactive Explanation with Audio</h2>
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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2C2522]/90">
                <Loader2 className="w-8 h-8 text-[#8B7355] animate-spin mb-2" />
                <span className="text-[#8B7355] text-center">
                  Generating animation with audio narration...<br/>
                  <span className="text-sm">This may take a moment</span>
                </span>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2C2522]/90">
                <div className="text-center p-4">
                  <span className="text-red-400 mb-4 block">{error}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      retryLoading();
                    }}
                    className="bg-[#8B7355] hover:bg-[#6B574A] px-4 py-2 rounded-lg text-[#e6ddd6] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  volume={volume}
                  muted={isMuted}
                  poster="/video-poster.jpg"
                  onLoadStart={() => console.log('Video loading started')}
                  onLoadedData={() => console.log('Video loaded successfully')}
                  onError={(e) => console.error('Video error:', e)}
                />
                
                {/* Buffering indicator */}
                {isBuffering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#2C2522]/90">
                <span className="text-[#8B7355]">Failed to load animation!! Trying again...</span>
              </div>
            )}
            
            {!isPlaying && !isLoading && !error && videoUrl && (
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
                  <p className="text-sm text-[#e6ddd6]/80">With audio narration</p>
                </div>
              </motion.div>
            )}

            {/* Enhanced Controls Overlay */}
            <AnimatePresence>
              {(showControls || !isPlaying) && !isLoading && !error && videoUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
                >
                  {/* Progress Bar */}
                  {duration > 0 && (
                    <div className="mb-3">
                      <div 
                        ref={progressRef}
                        className="w-full h-2 bg-white/20 rounded-full cursor-pointer relative"
                        onClick={handleProgressClick}
                        onMouseDown={handleProgressMouseDown}
                      >
                        <div 
                          className="h-full bg-[#8B7355] rounded-full transition-all duration-150"
                          style={{ width: `${progressPercentage}%` }}
                        />
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#8B7355] rounded-full shadow-lg transition-all duration-150"
                          style={{ left: `${progressPercentage}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Play/Pause */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPause();
                        }}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </button>

                      {/* Skip Buttons */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkipBackward();
                        }}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                      >
                        <SkipBack className="w-4 h-4 text-white" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkipForward();
                        }}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                      >
                        <SkipForward className="w-4 h-4 text-white" />
                      </button>

                      {/* Restart */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestart();
                        }}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4 text-white" />
                      </button>

                      {/* Volume Controls */}
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                          }}
                          className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
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
                          className="w-16 h-1 bg-white/20 rounded-lg slider cursor-pointer"
                        />
                      </div>

                      {/* Time Display */}
                      {duration > 0 && (
                        <span className="text-white text-sm ml-2">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      )}
                    </div>

                    {/* Fullscreen */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                      }}
                      className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
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
            {!isLoading && !error && videoUrl && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayPause}
                disabled={isBuffering}
                className="flex items-center gap-2 bg-[#6B574A] hover:bg-[#8B7355] px-4 py-2 rounded-lg transition-colors shadow-md text-[#e6ddd6] disabled:opacity-50"
              >
                {isBuffering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : isPlaying ? (
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
            
            {!isLoading && !error && videoUrl && duration > 0 && (
              <div className="text-sm text-gray-400">
                Duration: {formatTime(duration)}
              </div>
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
                        <span>Problem breakdown and analysis with audio narration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#6B574A]">•</span>
                        <span>Step-by-step solution walkthrough</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#6B574A]">•</span>
                        <span>Visual animations synchronized with explanations</span>
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
                      {approach.concepts?.map((concept, index) => (
                        <motion.span
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          className="bg-[#6B574A] text-[#e6ddd6] px-2 py-1 rounded text-xs"
                        >
                          {concept}
                        </motion.span>
                      )) || (
                        <span className="text-[#2C2522] text-sm">Loading concepts...</span>
                      )}
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
          background: #8B7355;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #8B7355;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default VideoSection;