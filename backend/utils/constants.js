const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];
const USER_ROLES = ['user', 'admin'];
const CHALLENGE_STATUSES = ['pending', 'accepted', 'declined', 'expired', 'completed'];
const USER_RANKS = ['Beginner', 'Intermediate', 'Advanced', 'Master'];
const RANK_THRESHOLDS = [
  { minXP: 10000, rank: 'Master' },
  { minXP: 5000, rank: 'Advanced' },
  { minXP: 1000, rank: 'Intermediate' },
];

module.exports = {
  OBJECT_ID_REGEX,
  DIFFICULTY_LEVELS,
  USER_ROLES,
  CHALLENGE_STATUSES,
  USER_RANKS,
  RANK_THRESHOLDS,
};
