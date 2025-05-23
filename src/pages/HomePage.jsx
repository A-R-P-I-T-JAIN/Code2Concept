import HeroSection from '../section/Hero';
import SearchInput from '../section/SearchInput';
import QuestionInputForm from '../section/QuestionInputForm';
import { useApp } from '../context/AppContext';

const HomePage = () => {
  const { handleGenerate, loading, error } = useApp();

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-6">
        <div className="text-center py-20">
          <HeroSection />
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <SearchInput onGenerate={handleGenerate} disabled={loading} />
          <QuestionInputForm onGenerate={handleGenerate} disabled={loading} />
          {loading && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Analyzing your problem...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage; 