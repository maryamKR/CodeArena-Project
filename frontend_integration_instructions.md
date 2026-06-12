# Frontend Integration Instructions for Secure Backend

To eliminate client-side cheating and protect internal database IDs, the backend security architecture has been updated. The frontend must align with these updates by querying the history endpoint via username, verifying question correctness via a secure endpoint in real-time, and submitting the complete answers array for server-side scoring.

---

## 1. User History Query Update
The backend now strictly validates that history is queried using the **username** parameter instead of the database `_id` (to avoid exposing internal database IDs in URLs).

### Dashboard Page (`frontend/src/Pages/Dashboard.jsx`)
Update the `useEffect` hook to check and query by `user.username`:

```diff
     useEffect(() => {
-        if (!user?._id) return;
+        if (!user?.username) return;
         api.get('/leaderboard')
             .then(res => setLeaderboard(Array.isArray(res.data) ? res.data.slice(0, 10) : []))
             .catch(() => setLeaderboard([]));
-        api.get(`/history/${user._id}`)
+        api.get(`/history/${user.username}`)
             .then(res => setHistory(Array.isArray(res.data) ? res.data.slice(0, 5) : []))
             .catch(() => setHistory([]));
     }, [user]);
```

### Profile Page (`frontend/src/Pages/Profile.jsx`)
Update the `useEffect` hook to fetch and execute only when `user.username` exists:

```diff
   useEffect(() => {
     const fetchHistory = async () => {
       try {
-        const res = await api.get(`/history/${user?._id}`);
+        const res = await api.get(`/history/${user?.username}`);
         setHistory(Array.isArray(res.data) ? res.data : []);
       } catch (err) {
         setHistory([]);
       } finally {
         setLoading(false);
       }
     };
-    if (user?._id) fetchHistory();
+    if (user?.username) fetchHistory();
   }, [user]);
```

---

## 2. Secure Quiz Verification and Submission (`frontend/src/Pages/QuizPlay.jsx`)

Because correct answers are stripped from `GET /api/questions`, the frontend no longer has access to the answers directly. 

We now verify each answer in real-time using the `POST /api/questions/:id/check` endpoint, accumulate the responses, and submit the final results array to `POST /api/scores` for secure grading.

### A. State Updates
Introduce `serverCorrectAnswer` (to hold the verified answer from the server) and `userAnswers` (to accumulate submissions):

```javascript
    const [xpGain, setXpGain] = useState(null);
    const [exploding, setExploding] = useState(false);
    // Added states:
    const [serverCorrectAnswer, setServerCorrectAnswer] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
```

### B. Answer Check Callback
Update `handleAnswer` to query the verification endpoint in real-time:

```javascript
    const handleAnswer = useCallback(async (answer) => {
        if (answered) return;
        setAnswered(true);
        setSelected(answer);

        const questionId = questions[current]?._id;
        try {
            // Check correctness securely on the server
            const res = await api.post(`/questions/${questionId}/check`, { selectedAnswer: answer });
            const { correct, correctAnswer } = res.data;
            
            setServerCorrectAnswer(correctAnswer);
            setUserAnswers(prev => [...prev, { questionId, selectedAnswer: answer }]);

            if (correct) {
                setScore(s => s + 1);
                setXpGain(10);
                setTimeout(() => setXpGain(null), 1500);
            }
        } catch (err) {
            console.error('Answer check failed:', err);
        }
    }, [answered, questions, current]);
```

### C. Next Question & Score Submit Callback
Update `handleNext` to submit the accumulated `userAnswers` payload to the backend and reset `serverCorrectAnswer` between questions:

```javascript
    const handleNext = useCallback(async () => {
        if (current + 1 >= questions.length) {
            try {
                // Submit the secure answers array
                const res = await api.post('/scores', {
                    answers: userAnswers,
                    difficulty,
                    timeLeft: timer,
                    timeLimit: TIMER_MAX,
                });
                navigate('/results', {
                    state: {
                        result: res.data.data,
                        score,
                        total: questions.length,
                        category,
                        difficulty,
                    },
                });
            } catch (err) {
                console.error('Score submission failed:', err);
                navigate('/results', {
                    state: { score, total: questions.length, category, difficulty },
                });
            }
            return;
        }
        setCurrent(c => c + 1);
        setSelected(null);
        setAnswered(false);
        setTimer(TIMER_MAX);
        setServerCorrectAnswer(null); // Reset for the next question
    }, [current, questions.length, userAnswers, score, timer, category, difficulty, navigate]);
```

### D. UI Rendering Guard (Button highlights & Result Banner)
To prevent the UI from flickering or defaulting to red/wrong while waiting for the network check to complete, only apply correctness styles and display banners once `serverCorrectAnswer` is resolved:

#### True/False Buttons
```javascript
                    <button
                        style={{
                            ...styles.answerBtn,
                            ...styles.trueBtn,
                            ...(answered && serverCorrectAnswer !== null && serverCorrectAnswer === true ? styles.correctBtn : {}),
                            ...(answered && serverCorrectAnswer !== null && selected === true && serverCorrectAnswer !== true ? styles.wrongBtn : {}),
                            opacity: answered ? 0.85 : 1,
                        }}
                        onClick={() => handleAnswer(true)}
                        disabled={answered}
                    >
                        <span style={styles.answerKey}>[T / 1]</span>
                        TRUE
                    </button>
                    <button
                        style={{
                            ...styles.answerBtn,
                            ...styles.falseBtn,
                            ...(answered && serverCorrectAnswer !== null && serverCorrectAnswer === false ? styles.correctBtn : {}),
                            ...(answered && serverCorrectAnswer !== null && selected === false && serverCorrectAnswer !== false ? styles.wrongBtn : {}),
                            opacity: answered ? 0.85 : 1,
                        }}
                        onClick={() => handleAnswer(false)}
                        disabled={answered}
                    >
                        <span style={styles.answerKey}>[F / 2]</span>
                        FALSE
                    </button>
```

#### Next Row Banner
```javascript
                {/* Next button */}
                {answered && serverCorrectAnswer !== null && (
                    <div style={styles.nextRow}>
                        <div style={{ ...styles.resultTag, color: selected === serverCorrectAnswer ? '#a6e22e' : '#f92672' }}>
                            {selected === serverCorrectAnswer ? '// correct! +10 XP' : '// wrong!'}
                        </div>
                        <button
                            style={styles.nextBtn}
                            onClick={handleNext}
                            onMouseEnter={e => e.currentTarget.style.background = '#8dca25'}
                            onMouseLeave={e => e.currentTarget.style.background = '#a6e22e'}
                        >
                            {current + 1 >= questions.length ? 'VIEW RESULTS →' : 'NEXT →'}
                        </button>
                    </div>
                )}

---

## 3. Daily Challenge Integration (`frontend/src/Pages/Home.jsx`)

The Daily Challenge details are served via `GET /api/daily-challenge`. 

### A. Fetching Daily Challenge Data
Replace the static `DAILY_CHALLENGE` object in `Home.jsx` with a `useEffect` hook that fetches the details and tracks the ticking countdown (`resetsIn`):

```javascript
import { useState, useEffect } from 'react';
import api from '../api/axios';

// Inside Home Component:
const [dailyChallenge, setDailyChallenge] = useState(null);
const [countdownText, setCountdownText] = useState('');

useEffect(() => {
    const fetchDailyChallenge = async () => {
        try {
            const res = await api.get('/daily-challenge');
            setDailyChallenge(res.data);
            
            // Start ticking the resetsIn countdown
            let secondsLeft = res.data.resetsIn;
            const formatTime = (secs) => {
                const h = Math.floor(secs / 3600).toString().padStart(2, '0');
                const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
                const s = (secs % 60).toString().padStart(2, '0');
                return `${h}:${m}:${s}`;
            };
            
            setCountdownText(formatTime(secondsLeft));
            const timer = setInterval(() => {
                if (secondsLeft <= 0) {
                    clearInterval(timer);
                    return;
                }
                secondsLeft--;
                setCountdownText(formatTime(secondsLeft));
            }, 1000);

            return () => clearInterval(timer);
        } catch (err) {
            console.error('Failed to fetch daily challenge:', err);
        }
    };
    fetchDailyChallenge();
}, []);
```

### B. Dynamic Rendering
Update the Daily Challenge container markup to use the fetched state:

```jsx
{dailyChallenge ? (
    <>
        <div style={styles.dcTitle}>{dailyChallenge.category?.name || 'Daily Challenge'}</div>
        <div style={styles.dcDetails}>
            <span style={styles.dcPill}>{dailyChallenge.category?.slug.toUpperCase()}</span>
            <span style={styles.dcPill}>{dailyChallenge.difficulty}</span>
            <span style={styles.dcBonus}>+{dailyChallenge.bonusXP} BONUS XP</span>
        </div>
        <div style={styles.dcFooter}>
            resets in {countdownText}
            <button 
                onClick={() => navigate('/quiz?daily=true')} 
                style={styles.dcPlayBtn}
            >
                PLAY NOW
            </button>
        </div>
    </>
) : (
    <div>// loading_daily_challenge...</div>
)}
```

---

## 4. Real-time Multiplayer and Matchmaking (Socket.IO)

Matchmaking and 1v1 challenges use a hybrid of REST API (to join the queue) and Socket.IO (for real-time events). The frontend should connect to the Socket server with `withCredentials: true` to pass the authentication cookie.

### A. Matchmaking Queue (`frontend/src/Pages/Matchmaking.jsx`)
Joining the queue is done via a REST POST request. The server will notify you via the `'matched'` socket event when an opponent is found.

```javascript
import { io } from 'socket.io-client';

// Establish connection to backend server
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
    withCredentials: true
});

// 1. Join the queue via REST API
const handleFindMatch = async (difficulty) => {
    try {
        await api.post('/matchmaking/join', {
            difficulty: difficulty,
            socketId: socket.id // Pass the socket ID so the server knows where to send events
        });
        // UI should show "Searching for opponent..."
    } catch (err) {
        console.error('Failed to join queue:', err);
    }
};

// 2. Listen for 'matched' event (Emitted when an opponent is found)
socket.on('matched', ({ challengeId, opponent }) => {
    // opponent includes { userId, username, rank }
    // Navigate to the match lobby page
    navigate(`/match/${challengeId}`);
});

// 3. Cancel search
const handleCancel = async () => {
    try {
        await api.delete('/matchmaking/leave');
        navigate('/dashboard');
    } catch (err) {
        console.error('Failed to leave queue:', err);
    }
};
```

### B. Match Arena Component (`frontend/src/Pages/Challenge.jsx`)
Once on the match page, you must join the specific match lobby using the `challengeId`.

```javascript
// Inside Challenge.jsx (or similar match arena component):
const { challengeId } = useParams();

useEffect(() => {
    // 1. Signal that you have entered the match lobby
    socket.emit('join_match', { challengeId });

    // 2. Wait for BOTH players to be ready. 
    // The server will then emit 'match_ready' with the secure questions.
    socket.on('match_ready', ({ questions }) => {
        // questions have 'correct_answer' stripped for anti-cheat
        setQuestions(questions);
        setGameStarted(true);
    });

    // 3. Track opponent's progress
    socket.on('opponent_progress', ({ userId, questionsAnswered, totalQuestions }) => {
        // Filter out your own progress events
        if (userId !== myUserId) {
            setOpponentProgress((questionsAnswered / totalQuestions) * 100);
        }
    });

    // 4. Handle game completion or forfeits
    socket.on('match_over', (data) => {
        const { winnerId, results, forfeit } = data;
        if (forfeit) {
            console.log('Opponent disconnected. Victory by forfeit!');
        }
        setResultsPayload(results); // results[userId] contains { correctCount, xpEarned, timeTaken }
        setGameOver(true);
    });

    return () => {
        socket.off('match_ready');
        socket.off('opponent_progress');
        socket.off('match_over');
    };
}, [challengeId]);

const handleAnswer = (answerBoolean) => {
    if (answered) return;
    setAnswered(true);
    setSelected(answerBoolean);

    // Emit answer directly to server for real-time verification & opponent tracking
    socket.emit('submit_answer', {
        challengeId,
        questionId: questions[current]._id,
        answer: answerBoolean,
        timeTakenSec: TIMER_MAX - timer
    });
};
```

---

## 5. Real-Time Challenge Notifications (New)

Direct 1v1 challenges now emit real-time events. You should implement these listeners globally (e.g., in a `SocketProvider` or `Navbar`) to show toast notifications or modals.

### Listening for Notifications
```javascript
useEffect(() => {
    // 1. Someone challenged you
    socket.on('challenge_received', (challenge) => {
        // challenge includes { id, sender, category, difficulty, message }
        showNotification(`New challenge from ${challenge.sender.username}!`);
    });

    // 2. Your challenge was accepted
    socket.on('challenge_accepted', ({ id, receiver }) => {
        showNotification(`${receiver.username} accepted your challenge!`);
        // Navigate to lobby or show confirmation
    });

    // 3. Your challenge was declined
    socket.on('challenge_declined', ({ id, receiver }) => {
        showNotification(`${receiver.username} declined your challenge.`);
    });

    return () => {
        socket.off('challenge_received');
        socket.off('challenge_accepted');
        socket.off('challenge_declined');
    };
}, []);
```
