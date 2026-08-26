import { createContext, useContext, useState, useCallback } from "react";
import { analyzeProblem } from "../services/api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentPage,   setCurrentPage]   = useState("home");
  const [questionData,  setQuestionData]  = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);

  const handleGenerate = useCallback(async (question) => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyzeProblem(question);
      setQuestionData(data);
      setCurrentPage("explanation");
    } catch (err) {
      setError(err.message || "Failed to analyze problem. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const retryAnalysis = useCallback(() => {
    if (questionData?.question) {
      handleGenerate(questionData.question);
    }
  }, [questionData, handleGenerate]);

  const handleBackToHome = useCallback(() => {
    setCurrentPage("home");
    setQuestionData(null);
    setError(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentPage,
        questionData,
        loading,
        error,
        handleGenerate,
        handleBackToHome,
        retryAnalysis,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
