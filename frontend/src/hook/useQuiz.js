import { useState, useEffect, useRef, useCallback } from 'react';
import { quizAPI } from '../api/quiz';

export function useQuiz(category, difficulty) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState(null);
  const [score, setScore]         = useState(0);
  const [timeLeft, setTimeLeft]   = useState(30);
  const [status, setStatus]       = useState('loading');
  const [result, setResult]       = useState(null);
  const [seenIds, setSeenIds]     = useState([]);
  const [error, setError]         = useState(null);
  const timerRef                  = useRef(null);

  // Fetch questions
  useEffect(() => {
    quizAPI.getQuestions(category, difficulty, seenIds)
      .then(res => {
        setQuestions(res.data);
        setSeenIds(prev => [...prev, ...res.data.map(q => q._id)]);
        setStatus('playing');
      })
      .catch(() => setError('Failed to load questions'));
  }, []);

  // 1. finishQuiz first
  const finishQuiz = useCallback(async (finalScore = score) => {
    setStatus('finished');
    try {
      const res = await quizAPI.submitScore(finalScore, difficulty, timeLeft, 30);
      setResult(res.data.data);
    } catch {
      setError('Failed to submit score');
    }
  }, [score, difficulty, timeLeft]);

  // 2. triggerExplosion second (uses finishQuiz)
  const triggerExplosion = useCallback(() => {
    setStatus('exploding');
    setTimeout(() => finishQuiz(), 1500);
  }, [finishQuiz]);

  // 3. handleAnswer third (uses finishQuiz)
  const handleAnswer = useCallback((answer) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(answer);

    const isCorrect = answer === questions[current].correctAnswer;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent(c => c + 1);
        setSelected(null);
        setTimeLeft(30);
        setStatus('playing');
      } else {
        finishQuiz(newScore);
      }
    }, 1000);
  }, [selected, current, questions, score, finishQuiz]);

  // 4. Timer useEffect last (uses triggerExplosion)
  useEffect(() => {
    if (status !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          triggerExplosion();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [status, current, triggerExplosion]);

  return {
    questions, current, selected, score,
    timeLeft, status, result, error,
    handleAnswer,
  };
}