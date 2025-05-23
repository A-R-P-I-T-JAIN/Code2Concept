const API_BASE_URL = 'http://localhost:5000/api';

export const analyzeProblem = async (question) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze problem');
    }
    console.log("response:",response);

    return await response.json();
  } catch (error) {
    console.error('Error analyzing problem:', error);
    throw error;
  }
}; 