# Frontend Integration Guide: Real-Time Matchmaking & 1v1 Battles

This guide breaks down exactly how to wire up your React/Vue frontend to the CodeArena Socket.IO matchmaking engine.

## 1. Centralized Socket Connection
Manage the Socket connection in a high-level Context provider or a custom hook (e.g., `useSocket`) to persist it across routes.

```javascript
import { io } from 'socket.io-client';

// The server uses HttpOnly cookies for Auth.
const socket = io('http://localhost:5000', {
  withCredentials: true, // REQUIRED: Allows cookies to be sent
});

socket.on('connected', (data) => {
  console.log('Socket Connected!', data.socketId);
  // Store data.userId and socket.id in your state manager
});
```

---

## 2. The Matchmaking UI (Joining the Queue)
On the dashboard, allow users to select difficulty and join the queue.

```javascript
const handleFindMatch = async (difficulty) => {
  setMatchStatus('Looking for opponent...');
  
  try {
    const response = await axios.post('/api/matchmaking/join', {
      difficulty,
      socketId: socket.id // REQUIRED
    });

    if (response.data.status === 'matched') {
      // Direct match found synchronously
      history.push(`/match/${response.data.challengeId}`);
    }
  } catch (err) {
    console.error('Failed to join queue', err);
  }
};
```

---

## 3. Listening for the Match (The Global Listener)
Listen for the `matched` event globally to redirect the user.

```javascript
useEffect(() => {
  socket.on('matched', (data) => {
    // data.opponent includes { userId, username, rank }
    alert(`Match Found against ${data.opponent.username}!`);
    history.push(`/match/${data.challengeId}`);
  });

  return () => socket.off('matched');
}, []);
```

---

## 4. The Match Arena Component (`/match/:challengeId`)

### Step A: Enter the Lobby
```javascript
useEffect(() => {
  socket.emit('join_match', { challengeId });
}, [challengeId]);
```

### Step B: Listen for Questions (`match_ready`)
```javascript
useEffect(() => {
  socket.on('match_ready', (data) => {
    // The server has stripped 'correct_answer' for security
    setQuestions(data.questions);
    setGameStarted(true);
  });

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
```javascript
const submitAnswer = (questionId, userChoice, timeTakenSec) => {
  socket.emit('submit_answer', {
    challengeId,
    questionId,
    answer: userChoice, // The boolean value (True/False)
    timeTakenSec
  });
  
  nextQuestion();
};
```

### Step D: Opponent Progress Bar
**Important:** Filter events by `userId` to ensure you are tracking the opponent, not yourself.

```javascript
useEffect(() => {
  socket.on('opponent_progress', (data) => {
    // Only update if the progress belongs to the opponent
    if (data.userId !== myUserId) {
      setOpponentProgress((data.questionsAnswered / data.totalQuestions) * 100);
    }
  });

  return () => socket.off('opponent_progress');
}, [myUserId]);
```

### Step E: Final Results (`match_over`)
The `results` object uses User IDs as keys.

```javascript
useEffect(() => {
  socket.on('match_over', (data) => {
    if (data.forfeit) {
      alert(`Opponent disconnected! Victory by forfeit.`);
    }

    const { winnerId, results } = data;
    const myResult = results[myUserId];
    
    // results[userId] contains { correctCount, xpEarned, timeTaken }
    if (winnerId === myUserId) {
      alert(`Victory! You earned ${myResult.xpEarned} XP!`);
    } else {
      alert(`Defeat! Better luck next time.`);
    }
  });

  return () => socket.off('match_over');
}, [myUserId]);
```
