import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Zap, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { useVideo } from '../context/VideoContext';
import { startAnimationJob, pollJobStatus } from '../services/api';
import VideoPlayer from './VideoPlayer';
import JobProgressIndicator from './JobProgressIndicator';

const POLL_INTERVAL_MS = 3000;

const VideoSection = ({ approach, isPlaying, togglePlay }) => {
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobState,    setJobState]    = useState(null);
  const [expanded,    setExpanded]    = useState(true);

  const { getVideoUrl, setVideoUrl, getApproachJobId, setApproachJobId, clearApproach } = useVideo();
  const pollRef = useRef(null);

  // ── Start a brand-new job ────────────────────────────────────────────────────
  const startJob = useCallback(async () => {
    clearInterval(pollRef.current);
    clearApproach(approach.title);
    setActiveJobId(null);
    setJobState({ status: 'starting', step: null, stepLabel: 'Starting…', progress: 0 });

    try {
      const { jobId } = await startAnimationJob(approach);
      setApproachJobId(approach.title, jobId); // persist so tab-switch can resume
      setActiveJobId(jobId);
    } catch (err) {
      setJobState({ status: 'failed', error: err.message });
    }
  }, [approach]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── On approach change: resume existing job or start fresh ───────────────────
  useEffect(() => {
    clearInterval(pollRef.current);

    const cachedUrl = getVideoUrl(approach.title);
    if (cachedUrl) {
      // Already done — show immediately, no new request
      setJobState({ status: 'done', videoUrl: cachedUrl, progress: 100 });
      setActiveJobId(null);
      return;
    }

    const existingJobId = getApproachJobId(approach.title);
    if (existingJobId) {
      // Job already started (possibly still running) — just resume polling
      setJobState(prev => prev?.status === 'done' ? prev : { status: 'running', step: null, stepLabel: 'Resuming…', progress: 0 });
      setActiveJobId(existingJobId);
      return;
    }

    // No prior job at all — kick one off
    startJob();
  }, [approach.title]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll while we have an active job ID ─────────────────────────────────────
  useEffect(() => {
    if (!activeJobId) return;

    const poll = async () => {
      try {
        const status = await pollJobStatus(activeJobId);
        setJobState(status);

        if (status.status === 'done') {
          setVideoUrl(approach.title, status.videoUrl);
          clearInterval(pollRef.current);
        } else if (status.status === 'failed') {
          clearInterval(pollRef.current);
        }
      } catch (err) {
        setJobState(prev => ({ ...prev, status: 'failed', error: err.message }));
        clearInterval(pollRef.current);
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [activeJobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cachedUrl = getVideoUrl(approach.title);
  const isLoading = !jobState || ['starting', 'running', 'pending', 'resuming'].includes(jobState.status);
  const isFailed  = jobState?.status === 'failed';
  const isDone    = jobState?.status === 'done';
  const videoUrl  = isDone ? (cachedUrl || jobState?.videoUrl) : null;

  return (
    <div className="bg-[#c4b5a5] rounded-xl border border-[#2C2522] overflow-hidden shadow-xl h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[#2C2522] p-4 bg-[#8B7355] flex-shrink-0">
        <h2 className="text-xl font-semibold text-[#e6ddd6]">Interactive Explanation with Audio</h2>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        {/* Video area */}
        <div className="relative">
          {isLoading && (
            <div className="bg-[#1C1917] rounded-lg aspect-video overflow-hidden border border-[#2C2522] relative">
              <JobProgressIndicator
                step={jobState?.step}
                stepLabel={jobState?.stepLabel}
                progress={jobState?.progress}
              />
            </div>
          )}

          {isFailed && (
            <div className="bg-[#1C1917] rounded-lg aspect-video overflow-hidden border border-[#2C2522] flex flex-col items-center justify-center gap-4 p-6">
              <p className="text-red-400 text-sm text-center">{jobState.error || 'Generation failed.'}</p>
              <button
                onClick={startJob}
                className="flex items-center gap-2 bg-[#8B7355] hover:bg-[#A67B5B] px-4 py-2 rounded-lg text-[#E6D5B8] transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {isDone && videoUrl && (
            <VideoPlayer
              videoUrl={videoUrl}
              isPlaying={isPlaying}
              togglePlay={togglePlay}
            />
          )}
        </div>

        {/* Play / Regenerate row */}
        {isDone && videoUrl && (
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={togglePlay}
              className="flex items-center gap-2 bg-[#6B574A] hover:bg-[#8B7355] px-4 py-2 rounded-lg transition-colors shadow-md text-[#e6ddd6] text-sm font-medium"
            >
              {isPlaying ? 'Pause Explanation' : 'Play Explanation'}
            </motion.button>
            <button
              onClick={startJob}
              title="Regenerate video"
              className="text-[#6B574A] hover:text-[#8B7355] transition-colors p-1"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Details accordion */}
        <div>
          <button
            onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-2 w-full text-left mb-2 text-[#2C2522]"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-medium">Video Details</span>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div className="bg-[#8B7355]/20 rounded-lg p-4 border border-[#2C2522]">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-[#2C2522]">
                    <BookOpen className="w-4 h-4" />
                    What you'll learn:
                  </h4>
                  <ul className="text-sm text-[#2C2522] space-y-1">
                    {[
                      'Problem breakdown and analysis with audio narration',
                      'Step-by-step solution walkthrough',
                      'Visual animations synchronized with explanations',
                      'Time and space complexity analysis',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#6B574A]">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#8B7355]/20 rounded-lg p-4 border border-[#2C2522]">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-[#2C2522]">
                    <Zap className="w-4 h-4" />
                    Key Concepts:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {approach.concepts?.length ? approach.concepts.map((c, i) => (
                      <motion.span
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        className="bg-[#6B574A] text-[#e6ddd6] px-2 py-1 rounded text-xs"
                      >
                        {c}
                      </motion.span>
                    )) : (
                      <span className="text-[#2C2522] text-sm italic">Concepts will appear here after analysis.</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VideoSection;