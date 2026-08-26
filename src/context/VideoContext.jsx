import { createContext, useContext, useState } from 'react';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [videoUrls, setVideoUrls] = useState({});  // approachTitle → completed videoUrl
  const [jobIds,    setJobIds]    = useState({});  // approachTitle → jobId (tracks in-progress too)

  const setVideoUrl = (approachTitle, url) =>
    setVideoUrls(prev => ({ ...prev, [approachTitle]: url }));

  const getVideoUrl = (approachTitle) => videoUrls[approachTitle];

  // Store the job ID as soon as a job is started so tab-switches can resume polling
  const setApproachJobId = (approachTitle, jobId) =>
    setJobIds(prev => ({ ...prev, [approachTitle]: jobId }));

  const getApproachJobId = (approachTitle) => jobIds[approachTitle];

  // Clear cached job + video for an approach (used on manual Retry)
  const clearApproach = (approachTitle) => {
    setVideoUrls(prev => { const n = { ...prev }; delete n[approachTitle]; return n; });
    setJobIds(prev    => { const n = { ...prev }; delete n[approachTitle]; return n; });
  };

  return (
    <VideoContext.Provider value={{
      setVideoUrl,
      getVideoUrl,
      setApproachJobId,
      getApproachJobId,
      clearApproach,
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) throw new Error('useVideo must be used within a VideoProvider');
  return context;
};