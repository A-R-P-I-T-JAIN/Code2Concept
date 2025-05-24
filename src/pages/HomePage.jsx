import HeroSection from '../section/Hero';
import SearchInput from '../section/SearchInput';
import QuestionInputForm from '../section/QuestionInputForm';
import { useApp } from '../context/AppContext';
import './HomePage.css';

const HomePage = () => {
  const { handleGenerate, loading, error } = useApp();

  return (
    <div className="min-h-screen relative overflow-hidden ">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(#8B7355 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      <main className="container mx-auto px-6 relative">
        <div className="text-center py-20">
          <HeroSection />
          {error && (
            <div className="bg-[#8B7355]/20 backdrop-blur-sm border border-[#8B7355] text-[#E6D5B8] px-4 py-3 rounded-lg relative mb-4 max-w-3xl mx-auto" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {/* <SearchInput onGenerate={handleGenerate} disabled={loading} /> */}
          <QuestionInputForm onGenerate={handleGenerate} disabled={loading} />
        </div>
      </main>

      {loading && (
        <div className="fixed inset-0 bg-[#2C2522]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#8B7355] p-6 rounded-xl shadow-xl flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#E6D5B8] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[#E6D5B8] font-medium">Generating...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;