import Navbar from './section/Navbar';
import HomePage from './pages/HomePage';
import DSAExplanationPage from './section/DSAExplanationPage';
import { AppProvider, useApp } from './context/AppContext';
import { VideoProvider } from './context/VideoContext';

const AppContent = () => {
  const { currentPage, questionData, handleBackToHome } = useApp();

  if (currentPage === 'explanation') {
    return (
      <DSAExplanationPage 
        questionData={{ ...questionData }} 
        onBack={handleBackToHome}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <HomePage />
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <VideoProvider>
        <AppContent />
      </VideoProvider>
    </AppProvider>
  );
};

export default App;