import api from './axios';

export const quizAPI = {
  getQuestions: (category, difficulty, seenIds = []) =>
    api.get('/quiz', {
      params: {
        category,
        difficulty,
        exclude: seenIds.join(','),
      },
    }),

  submitScore: (correctAnswers, difficulty, timeLeft, timeLimit) =>
    api.post('/scores', { correctAnswers, difficulty, timeLeft, timeLimit }),
};