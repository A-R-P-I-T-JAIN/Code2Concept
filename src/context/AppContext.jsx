import { createContext, useContext, useState } from "react";
import { analyzeProblem } from "../services/api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState("home");
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async (userInput) => {
    console.log("userInput:", userInput.url);

    try {
      setLoading(true);
      setError(null);
      const data = await analyzeProblem(userInput.url);
      setQuestionData(data);
      setCurrentPage("explanation");
    } catch (err) {
      setError(err.message || "Failed to analyze problem");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    setCurrentPage("home");
    setQuestionData(null);
    setError(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        questionData,
        loading,
        error,
        handleGenerate,
        handleBackToHome,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
