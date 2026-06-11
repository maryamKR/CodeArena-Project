require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Question = require('../models/Question');
const User = require('../models/User');

const categories = [
  { name: 'JavaScript', slug: 'js', color: '#e6db74' },
  { name: 'Python', slug: 'py', color: '#66d9e8' },
  { name: 'SQL', slug: 'sql', color: '#f92672' },
  { name: 'Algorithms', slug: 'algo', color: '#a6e22e' },
  { name: 'React', slug: 'react', color: '#61dafb' },
  { name: 'Node.js', slug: 'node', color: '#8cc84b' },
  { name: 'DevOps', slug: 'devops', color: '#ff9900' },
  { name: 'HTML/CSS', slug: 'html', color: '#e34c26' },
  { name: 'Git', slug: 'git', color: '#f14e32' },
  { name: 'Docker', slug: 'docker', color: '#2496ed' }
];

const seedDB = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // 2. Clear existing data
    await Category.deleteMany({});
    await Question.deleteMany({});
    await User.deleteMany({ role: { $ne: 'admin' } }); // Keep admin if any
    console.log('Database cleared.');

    // 3. Create Categories
    const createdCategories = await Category.insertMany(categories);
    console.log('Categories seeded.');

    // Map categories for easy access
    const catMap = {};
    createdCategories.forEach(c => {
      catMap[c.slug] = c._id;
    });

    // 4. Create Questions linked to Categories (just a few per category for "10 quizzes")
    const questions = [];
    categories.forEach(cat => {
      questions.push({ text: `Is this a question about ${cat.name}?`, correct_answer: true, category: catMap[cat.slug], difficulty: 'Easy' });
      questions.push({ text: `Another advanced question about ${cat.name}?`, correct_answer: false, category: catMap[cat.slug], difficulty: 'Medium' });
      questions.push({ text: `Hardest concept in ${cat.name}?`, correct_answer: true, category: catMap[cat.slug], difficulty: 'Hard' });
    });

    await Question.insertMany(questions);
    console.log('Questions seeded.');

    // 5. Create Mock Users with Scores and Ranks
    const users = [
      { username: 'rookie_dev', email: 'rookie@example.com', password: 'password123', totalXP: 150, rank: 'Beginner', isOnline: true },
      { username: 'mid_coder', email: 'mid@example.com', password: 'password123', totalXP: 2500, rank: 'Intermediate', isOnline: false },
      { username: 'pro_hacker', email: 'pro@example.com', password: 'password123', totalXP: 8000, rank: 'Advanced', isOnline: true },
      { username: 'algo_master', email: 'master@example.com', password: 'password123', totalXP: 15000, rank: 'Master', badges: ['First Blood', 'Speedster'], isOnline: false },
      { username: 'js_ninja', email: 'js@example.com', password: 'password123', totalXP: 5500, rank: 'Advanced', isOnline: true }
    ];

    // Give them some categoryXP
    users[0].categoryXP = { [catMap['js']]: 100, [catMap['html']]: 50 };
    users[1].categoryXP = { [catMap['py']]: 1000, [catMap['sql']]: 1500 };
    users[2].categoryXP = { [catMap['algo']]: 4000, [catMap['docker']]: 4000 };
    users[3].categoryXP = { [catMap['algo']]: 10000, [catMap['py']]: 5000 };
    users[4].categoryXP = { [catMap['js']]: 5000, [catMap['react']]: 500 };

    for (const u of users) {
      await User.create(u); // Using create to trigger pre-save hook for password
    }
    console.log('Mock users seeded.');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();