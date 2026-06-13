const Challenge = require('../models/Challenge');
const Question = require('../models/Question');
const User = require('../models/User');
const scoreService = require('./scoreService');

// In-memory store for active matches
// Map<challengeId, MatchState>
const activeMatches = new Map();

class MatchService {
  /**
   * Called when a player connects to the match lobby.
   */
  async joinMatch(challengeId, userId, socket, io) {
    try {
      if (process.env.NODE_ENV !== 'production') console.log(`User ${userId} joining match ${challengeId}`);
      // 1. Verify the challenge
      const challenge = await Challenge.findOne({ challengeId }).populate('sender receiver category');

    if (!challenge) {
      socket.emit('match_error', { message: 'Challenge not found' });
      return;
    }

    if (challenge.status !== 'accepted') {
      socket.emit('match_error', { message: `Challenge is ${challenge.status}, cannot join.` });
      return;
    }

    // 2. Verify the user is a participant
    const isSender = challenge.sender._id.toString() === userId.toString();
    const isReceiver = challenge.receiver._id.toString() === userId.toString();

    if (!isSender && !isReceiver) {
      socket.emit('match_error', { message: 'You are not part of this challenge' });
      return;
    }

    // 3. Join the socket room
    socket.join(challengeId);

    // 4. Initialize match state if it doesn't exist
    if (!activeMatches.has(challengeId)) {
      activeMatches.set(challengeId, {
        challenge,
        questions: [],
        players: {
          [challenge.sender._id.toString()]: { ready: false, answers: [], correctCount: 0, timeTaken: 0, finished: false },
          [challenge.receiver._id.toString()]: { ready: false, answers: [], correctCount: 0, timeTaken: 0, finished: false }
        }
      });
    }

    const matchState = activeMatches.get(challengeId);
    matchState.players[userId.toString()].ready = true;
    matchState.players[userId.toString()].socketId = socket.id;

    // 5. Notify room that a player joined
    io.to(challengeId).emit('player_joined', { userId });

    // 6. Check if both are ready
      const players = Object.values(matchState.players);
      if (process.env.NODE_ENV !== 'production') console.log(`Players ready count: ${players.filter(p => p.ready).length}`);
      if (players.length === 2 && players.every(p => p.ready)) {
        await this.startMatch(challengeId, io);
      }
    } catch (error) {
      console.error('Error in joinMatch:', error);
      socket.emit('match_error', { message: 'Internal server error' });
    }
  }

  /**
   * Fetches questions and starts the match.
   */
  async startMatch(challengeId, io) {
    try {
      if (process.env.NODE_ENV !== 'production') console.log(`Starting match for ${challengeId}`);
      const matchState = activeMatches.get(challengeId);
    const { challenge } = matchState;

      // Fetch 10 random questions matching category & difficulty
      // Fallback to random questions if specific ones don't exist
      let matchQuery = { difficulty: challenge.difficulty };
      if (challenge.category) {
        matchQuery.category = challenge.category._id;
      }

      let questions = await Question.aggregate([
        { $match: matchQuery },
        { $sample: { size: 10 } }
      ]);

    if (questions.length === 0) {
      // Fallback: just fetch 10 random questions of that difficulty
      questions = await Question.aggregate([
        { $match: { difficulty: challenge.difficulty } },
        { $sample: { size: 10 } }
      ]);
    }

    // Store the real questions with answers securely on the backend
    matchState.questions = questions;

    // Strip out the correct_answer so users cannot cheat by inspecting the console/network
    const sanitizedQuestions = questions.map(q => ({
      _id: q._id,
      text: q.text,
      category: q.category,
      difficulty: q.difficulty
    }));

      // Emit the sanitized questions to both players to start the match
      if (process.env.NODE_ENV !== 'production') console.log(`Emitting match_ready to room ${challengeId}`);
      io.to(challengeId).emit('match_ready', { questions: sanitizedQuestions });
    } catch (error) {
      console.error('Error in startMatch:', error);
    }
  }

  /**
   * Handles an answer submission from a player.
   */
  async submitAnswer(challengeId, userId, questionId, answerBoolean, timeTakenSec, io) {
    const matchState = activeMatches.get(challengeId);
    if (!matchState) return;

    const playerState = matchState.players[userId.toString()];
    if (!playerState || playerState.finished) return;

    // Server-side verification (Anti-cheat)
    const question = matchState.questions.find(q => q._id.toString() === questionId.toString());
    if (!question) return;

    const isCorrect = question.correct_answer === answerBoolean;

    const validTimeTakenSec = typeof timeTakenSec === 'number' && !isNaN(timeTakenSec) ? timeTakenSec : 0;

    playerState.answers.push({ questionId, isCorrect, timeTakenSec: validTimeTakenSec });
    playerState.timeTaken += validTimeTakenSec;
    if (isCorrect) {
      playerState.correctCount += 1;
    }

    // Notify the opponent of the progress
    // (We emit to the room, but the frontend can filter by userId to show opponent progress)
    io.to(challengeId).emit('opponent_progress', {
      userId,
      questionsAnswered: playerState.answers.length,
      totalQuestions: matchState.questions.length
    });

    // Check if player has finished all questions
    if (playerState.answers.length >= matchState.questions.length) {
      playerState.finished = true;
      io.to(challengeId).emit('player_finished', { userId });

      // Check if both players are finished
      const players = Object.values(matchState.players);
      if (players.every(p => p.finished)) {
        await this.endMatch(challengeId, io);
      }
    }
  }

  /**
   * Handles the end of the match, calculates XP, and saves to DB.
   */
  async endMatch(challengeId, io) {
    const matchState = activeMatches.get(challengeId);
    if (!matchState) return;

    const { challenge, players } = matchState;
    const senderId = challenge.sender._id.toString();
    const receiverId = challenge.receiver._id.toString();

    const senderState = players[senderId];
    const receiverState = players[receiverId];

    // Total time given for 10 questions (assuming 15s per question)
    const TIME_LIMIT = 150;

    // Calculate XP for both using the existing secure score service
    const senderResult = await scoreService.submitScore(
      senderId,
      senderState.correctCount,
      challenge.difficulty,
      Math.max(0, TIME_LIMIT - senderState.timeTaken), // timeLeft
      TIME_LIMIT,
      challenge.category ? challenge.category._id : null
    );

    const receiverResult = await scoreService.submitScore(
      receiverId,
      receiverState.correctCount,
      challenge.difficulty,
      Math.max(0, TIME_LIMIT - receiverState.timeTaken), // timeLeft
      TIME_LIMIT,
      challenge.category ? challenge.category._id : null
    );

    // Determine winner
    let winnerId = null;
    if (senderResult.earnedXP > receiverResult.earnedXP) {
      winnerId = senderId;
    } else if (receiverResult.earnedXP > senderResult.earnedXP) {
      winnerId = receiverId;
    }

    // Update challenge status
    challenge.status = 'completed';
    await challenge.save();

    const finalPayload = {
      winnerId,
      results: {
        [senderId]: { correctCount: senderState.correctCount, xpEarned: senderResult.earnedXP, timeTaken: senderState.timeTaken },
        [receiverId]: { correctCount: receiverState.correctCount, xpEarned: receiverResult.earnedXP, timeTaken: receiverState.timeTaken }
      }
    };

    if (process.env.NODE_ENV !== 'production') console.log('MATCH OVER emitted', finalPayload);

    // Emit final results
    io.to(challengeId).emit('match_over', finalPayload);

    // Clean up memory
    activeMatches.delete(challengeId);
  }

  /**
   * Handle unexpected disconnects mid-match.
   * Awards the win to the remaining player by forfeit.
   */
  async handleDisconnect(socket, io) {
    // Find if this socket was in any active match
    for (const [challengeId, matchState] of activeMatches.entries()) {
      const disconnectedId = Object.keys(matchState.players).find(
        id => matchState.players[id].socketId === socket.id
      );

      if (!disconnectedId) continue;

      // Found the match this player was in
      const winnerId = Object.keys(matchState.players).find(id => id !== disconnectedId);

      // Only process a forfeit win if the match had actually started
      if (matchState.questions && matchState.questions.length > 0) {
        // Notify the remaining player
        if (winnerId) {
          // Award XP to the winner for the questions they already answered
          let winnerXP = 0;
          try {
            const { challenge } = matchState;
            const TIME_LIMIT = 150;
            const winnerState = matchState.players[winnerId];
            const scoreResult = await scoreService.submitScore(
              winnerId,
              winnerState.correctCount,
              challenge.difficulty,
              Math.max(0, TIME_LIMIT - winnerState.timeTaken),
              TIME_LIMIT,
              challenge.category ? challenge.category._id : null
            );
            winnerXP = scoreResult.earnedXP;

            // Mark challenge as completed
            challenge.status = 'completed';
            await challenge.save();
          } catch (err) {
            console.error('Error saving forfeit result:', err);
          }

          io.to(challengeId).emit('match_over', {
            winnerId,
            forfeit: true,
            forfeitedBy: disconnectedId,
            results: {
              [disconnectedId]: { correctCount: 0, xpEarned: 0, timeTaken: 0 },
              [winnerId]: {
                correctCount: matchState.players[winnerId].correctCount,
                xpEarned: winnerXP,
                timeTaken: matchState.players[winnerId].timeTaken,
              },
            },
          });
        }
      } else {
        // Match was still in the lobby phase (waiting for both players to join)
        // Abort the match
        io.to(challengeId).emit('match_error', { message: 'Opponent disconnected before the match started.' });
        try {
          const { challenge } = matchState;
          challenge.status = 'declined'; // Mark as declined/aborted
          await challenge.save();
        } catch (err) {
          console.error('Error aborting unstarted match:', err);
        }
      }

      // Clean up
      activeMatches.delete(challengeId);
      break;
    }
  }
}

module.exports = new MatchService();
