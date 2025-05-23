import HeroSection from '../section/Hero';
import SearchInput from '../section/SearchInput';
import QuestionInputForm from '../section/QuestionInputForm';
import { useApp } from '../context/AppContext';

const HomePage = () => {
  const { handleGenerate, loading, error } = useApp();

  return (
    <div className="relative overflow-hidden min-h-screen bg-black text-white">
      {/* Glowing Light Effect in Background */}
      <div className="absolute -top-1/2 left-1/2 transform -translate-x-1/2 w-[700px] h-[700px] bg-[radial-gradient(ellipse_at_center,_rgba(0,153,255,0.3)_0%,_transparent_70%)] pointer-events-none z-0 blur-2xl" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        
        {/* Error message */}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Loading message */}
        {loading && (
          <div className="text-lg font-semibold animate-pulse">
            Analyzing your problem...
          </div>
        )}

        {/* Sections */}
        <HeroSection />
        <SearchInput />
        <QuestionInputForm />
      </div>
    </div>
  );
};

export default HomePage;
