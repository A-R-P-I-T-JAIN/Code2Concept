import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Pause, Maximize2, Minimize2, Loader2,
  Volume2, VolumeX, RotateCcw, SkipForward, SkipBack,
} from 'lucide-react';

const VideoPlayer = ({ videoUrl, isPlaying, togglePlay }) => {
  const [currentTime,   setCurrentTime]   = useState(0);
  const [duration,      setDuration]      = useState(0);
  const [volume,        setVolume]        = useState(0.8);
  const [isMuted,       setIsMuted]       = useState(false);
  const [showControls,  setShowControls]  = useState(true);
  const [isHovering,    setIsHovering]    = useState(false);
  const [isDragging,    setIsDragging]    = useState(false);
  const [isBuffering,   setIsBuffering]   = useState(false);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [error,         setError]         = useState(null);

  const videoRef          = useRef(null);
  const containerRef      = useRef(null);
  const progressRef       = useRef(null);
  const controlsTimerRef  = useRef(null);

  // ── Video event listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlers = {
      timeupdate:      () => setCurrentTime(video.currentTime),
      loadedmetadata:  () => { setDuration(video.duration); setIsBuffering(false); },
      loadstart:       () => setIsBuffering(true),
      canplay:         () => setIsBuffering(false),
      waiting:         () => setIsBuffering(true),
      playing:         () => setIsBuffering(false),
      volumechange:    () => { setVolume(video.volume); setIsMuted(video.muted); },
      error:           () => setError('Failed to load video. Please retry.'),
      ended:           () => { if (isPlaying) togglePlay(); },
    };

    Object.entries(handlers).forEach(([e, fn]) => video.addEventListener(e, fn));
    return () => Object.entries(handlers).forEach(([e, fn]) => video.removeEventListener(e, fn));
  }, [isPlaying, togglePlay]);

  // ── Auto-hide controls ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying && !isHovering && !isDragging) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
      clearTimeout(controlsTimerRef.current);
    }
    return () => clearTimeout(controlsTimerRef.current);
  }, [isPlaying, isHovering, isDragging]);

  // ── Fullscreen listener ────────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.code) {
        case 'Space':        e.preventDefault(); handlePlayPause(); break;
        case 'ArrowRight':   e.preventDefault(); seekBy(10);        break;
        case 'ArrowLeft':    e.preventDefault(); seekBy(-10);       break;
        case 'KeyM':         toggleMute();                          break;
        case 'KeyF':         toggleFullscreen();                    break;
        default: break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // ── Progress drag ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => seek(e);
    const onUp   = () => setIsDragging(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [isDragging]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else video.play().catch(() => setError('Unable to play video.'));
    togglePlay();
  }, [isPlaying, togglePlay]);

  const seek = useCallback((e) => {
    if (!progressRef.current || !videoRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    videoRef.current.currentTime = pct * duration;
  }, [duration]);

  const seekBy = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const toggleMute = () => { if (videoRef.current) videoRef.current.muted = !videoRef.current.muted; };
  const handleVolumeSlider = (e) => {
    const v = parseFloat(e.target.value);
    if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; }
  };
  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    if (!isPlaying) handlePlayPause();
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1C1917]/90 rounded-lg">
        <p className="text-red-400 mb-4 text-sm text-center px-4">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg aspect-video overflow-hidden border border-[#2C2522] cursor-pointer select-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handlePlayPause}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        volume={volume}
        muted={isMuted}
      />

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Pause overlay */}
      {!isPlaying && !isBuffering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-[#1C1917]/70"
        >
          <div className="w-20 h-20 bg-[#8B7355] rounded-full flex items-center justify-center hover:bg-[#A67B5B] transition-colors">
            <Play className="w-8 h-8 text-[#E6D5B8] ml-1" />
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <AnimatePresence>
        {(showControls || !isPlaying) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Progress bar */}
            {duration > 0 && (
              <div className="mb-3">
                <div
                  ref={progressRef}
                  className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative"
                  onClick={seek}
                  onMouseDown={(e) => { setIsDragging(true); seek(e); }}
                >
                  <div className="h-full bg-[#8B7355] rounded-full" style={{ width: `${pct}%` }} />
                  <div
                    className="absolute top-1/2 w-3 h-3 bg-[#8B7355] rounded-full shadow-lg"
                    style={{ left: `${pct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                  />
                </div>
              </div>
            )}

            {/* Buttons row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                  {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                </button>
                <button onClick={() => seekBy(-10)} aria-label="Rewind 10 seconds"
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                  <SkipBack className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => seekBy(10)} aria-label="Forward 10 seconds"
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                  <SkipForward className="w-4 h-4 text-white" />
                </button>
                <button onClick={handleRestart} aria-label="Restart"
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
                <div className="flex items-center gap-1.5 ml-1">
                  <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}
                    className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeSlider}
                    onClick={e => e.stopPropagation()}
                    aria-label="Volume"
                    className="w-16 h-1 bg-white/20 rounded-lg accent-[#8B7355] cursor-pointer"
                  />
                </div>
                {duration > 0 && (
                  <span className="text-white/80 text-xs ml-2 tabular-nums">
                    {fmt(currentTime)} / {fmt(duration)}
                  </span>
                )}
              </div>
              <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
              </button>
            </div>

            {/* Keyboard hint */}
            <p className="text-white/30 text-xs mt-1.5 text-right">
              Space · ← → · M · F
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
