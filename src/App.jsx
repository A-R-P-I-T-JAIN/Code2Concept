import Navbar from './section/Navbar';
import HomePage from './pages/HomePage';
import DSAExplanationPage from './section/DSAExplanationPage';
import ErrorBoundary from './components/ErrorBoundary';
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
    <ErrorBoundary>
      <AppProvider>
        <VideoProvider>
          <AppContent />
        </VideoProvider>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;