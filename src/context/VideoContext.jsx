import { createContext, useContext, useState } from 'react';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [videoUrls, setVideoUrls] = useState({});
  const [requestedVideos, setRequestedVideos] = useState({});

  const setVideoUrl = (approachId, url) => {
    setVideoUrls(prev => ({
      ...prev,
      [approachId]: url
    }));
  };

  const getVideoUrl = (approachId) => {
    return videoUrls[approachId];
  };

  const setVideoRequested = (approachId, requested) => {
    setRequestedVideos(prev => ({
      ...prev,
      [approachId]: requested
    }));
  };

  const isVideoRequested = (approachId) => {
    return requestedVideos[approachId] || false;
  };

  return (
    <VideoContext.Provider value={{ 
      setVideoUrl, 
      getVideoUrl, 
      setVideoRequested, 
      isVideoRequested 
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};