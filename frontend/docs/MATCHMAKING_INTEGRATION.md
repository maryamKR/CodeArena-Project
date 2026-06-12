# Frontend Integration Guide: Real-Time Matchmaking & 1v1 Battles

This guide breaks down exactly how to wire up your React/Vue frontend to the newly built Socket.IO matchmaking engine.

## 1. Centralized Socket Connection
Because the user's socket connection needs to persist as they navigate from the Dashboard to the Match Lobby, you should manage the Socket connection in a high-level Context provider or a custom hook (e.g., `useSocket`).

```javascript
import { io } from 'socket.io-client';

// The server automatically uses HttpOnly cookies for Auth.
// No need to pass tokens manually if cookies are working!
const socket = io('http://localhost:5000', {
  withCredentials: true, // IMPORTANT: Allows cookies to be sent
});

socket.on('connected', (data) => {
  console.log('Socket Connected!', data.socketId);
  // Store socket.id in your state manager (Redux/Zustand/Context)
});
```

---

## 2. The Matchmaking UI (Joining the Queue)
On the user's dashboard, provide a UI to select a difficulty and click "Find Match".

```javascript
const handleFindMatch = async (difficulty) => {
  setMatchStatus('Looking for opponent...');
  
  try {
    const response = await axios.post('/api/matchmaking/join', {
      difficulty,
      socketId: socket.id // Pass the socket ID you got earlier
    });

    if (response.data.status === 'matched') {
      // Rare edge case: The server found a match synchronously!
      // You can immediately route the user.
      history.push(`/match/${response.data.challengeId}`);
    } else {
      // You are in the queue. Wait for the 'matched' socket event.
    }
  } catch (err) {
    console.error('Failed to join queue', err);
  }
};
```

---

## 3. Listening for the Match (The Global Listener)
Somewhere globally in your app (like your App.js or Navigation bar), listen for the `matched` event so you can pull the user into a game regardless of what page they are looking at.

```javascript
useEffect(() => {
  socket.on('matched', (data) => {
    alert('Match Found!');
    // Automatically redirect the user to the match arena page
    history.push(`/match/${data.challengeId}`);
  });

  return () => socket.off('matched');
}, []);
```

---

## 4. The Match Arena Component (`/match/:challengeId`)
When the user arrives at this URL, they must immediately tell the server they are ready to play.

### Step A: Enter the Lobby
```javascript
const { challengeId } = useParams();

useEffect(() => {
  // Tell the server you have arrived in the room
  socket.emit('join_match', { challengeId });
}, [challengeId]);
```

### Step B: Listen for Questions (`match_ready`)
```javascript
const [questions, setQuestions] = useState([]);
const [gameStarted, setGameStarted] = useState(false);

useEffect(() => {
  socket.on('match_ready', (data) => {
    // The server has confirmed BOTH players are here and generated questions!
    setQuestions(data.questions);
    setGameStarted(true);
  });

  // Handle someone chickening out before the match starts
  socket.on('match_error', (error) => {
    alert(error.message);
    history.push('/dashboard');
  });

  return () => {
    socket.off('match_ready');
    socket.off('match_error');
  };
}, []);
```

### Step C: The Game Loop (Submitting Answers)
Render the first question. When the user clicks an answer, calculate how long it took, and submit it!

```javascript
const submitAnswer = (questionId, isCorrect, timeTakenSec) => {
  socket.emit('submit_answer', {
    challengeId,
    questionId,
    answer: isCorrect, // Note: The server will double-check this, no cheating!
    timeTakenSec
  });
  
  // Move to the next question in your local state
  nextQuestion();
};
```

### Step D: Opponent Progress Bar
You can build a cool visual progress bar for the opponent!

```javascript
const [opponentProgress, setOpponentProgress] = useState(0);

useEffect(() => {
  socket.on('opponent_progress', (data) => {
    // e.g., Update a progress bar indicating they are on question 5 of 10
    setOpponentProgress((data.questionsAnswered / data.totalQuestions) * 100);
  });

  return () => socket.off('opponent_progress');
}, []);
```

### Step E: The Grand Finale (`match_over`)
When the match is completely finished, the server will broadcast the winner and the exact XP breakdown.

```javascript
useEffect(() => {
  socket.on('match_over', (data) => {
    if (data.forfeit) {
      alert(`Opponent disconnected! You win by default!`);
    }

    const { winnerId, results } = data;
    const myResult = results[myUserId];
    const opponentResult = results[opponentUserId];

    if (winnerId === myUserId) {
      alert(`Victory! You earned ${myResult.xpEarned} XP!`);
    } else {
      alert(`Defeat! Better luck next time.`);
    }

    // Show a summary modal, then navigate home
  });

  return () => socket.off('match_over');
}, []);
```

## Need to cancel matchmaking?
If the user clicks "Cancel" while waiting for the matchmaking spinner:
```javascript
const cancelMatchmaking = async () => {
  await axios.delete('/api/matchmaking/leave');
  setMatchStatus('Cancelled');
};
```
