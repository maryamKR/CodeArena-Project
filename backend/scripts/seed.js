require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Question = require('../models/Question');

const categories = [
  { name: 'JavaScript', slug: 'js', color: '#e6db74' },
  { name: 'Python', slug: 'py', color: '#66d9e8' },
  { name: 'SQL', slug: 'sql', color: '#f92672' },
  { name: 'Algorithms', slug: 'algo', color: '#a6e22e' }
];

const seedDB = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // 2. Clear existing data
    await Category.deleteMany({});
    await Question.deleteMany({});
    console.log('Database cleared.');

    // 3. Create Categories
    const createdCategories = await Category.insertMany(categories);
    console.log('Categories seeded.');

    // 4. Create Questions linked to Categories
    const js = createdCategories.find(c => c.slug === 'js')._id;
    const py = createdCategories.find(c => c.slug === 'py')._id;
    const sql = createdCategories.find(c => c.slug === 'sql')._id;
    const algo = createdCategories.find(c => c.slug === 'algo')._id;

    const questions = [
      // ── JavaScript (Easy / Medium / Hard) ──
      { text: 'Is JavaScript a dynamically typed language?', correct_answer: true, category: js, difficulty: 'Easy' },
      { text: 'Are arrow functions hoisted in JavaScript?', correct_answer: false, category: js, difficulty: 'Easy' },
      { text: 'Does "==" perform type coercion in JavaScript?', correct_answer: true, category: js, difficulty: 'Medium' },
      { text: 'Is "null" an object type in JavaScript according to typeof?', correct_answer: true, category: js, difficulty: 'Medium' },
      { text: 'Does Promise.all reject if any single promise rejects?', correct_answer: true, category: js, difficulty: 'Hard' },

      // ── Python (Easy / Medium / Hard) ──
      { text: 'Does Python use indentation to define code blocks?', correct_answer: true, category: py, difficulty: 'Easy' },
      { text: 'Is Python a compiled language?', correct_answer: false, category: py, difficulty: 'Easy' },
      { text: 'Are Python lists immutable?', correct_answer: false, category: py, difficulty: 'Medium' },
      { text: 'Does Python support multiple inheritance?', correct_answer: true, category: py, difficulty: 'Medium' },
      { text: 'Is the GIL in CPython released during I/O operations?', correct_answer: true, category: py, difficulty: 'Hard' },

      // ── SQL (Easy / Medium / Hard) ──
      { text: 'Does SELECT retrieve data from a database table?', correct_answer: true, category: sql, difficulty: 'Easy' },
      { text: 'Is DELETE the same as TRUNCATE in SQL?', correct_answer: false, category: sql, difficulty: 'Easy' },
      { text: 'Does a LEFT JOIN return all rows from the left table?', correct_answer: true, category: sql, difficulty: 'Medium' },
      { text: 'Can a table have more than one PRIMARY KEY column?', correct_answer: false, category: sql, difficulty: 'Medium' },
      { text: 'Does a correlated subquery execute once for every row of the outer query?', correct_answer: true, category: sql, difficulty: 'Hard' },

      // ── Algorithms (Easy / Medium / Hard) ──
      { text: 'Is binary search O(log n) time complexity?', correct_answer: true, category: algo, difficulty: 'Easy' },
      { text: 'Is bubble sort the most efficient sorting algorithm?', correct_answer: false, category: algo, difficulty: 'Easy' },
      { text: 'Does a stack follow FIFO ordering?', correct_answer: false, category: algo, difficulty: 'Medium' },
      { text: 'Is merge sort a stable sorting algorithm?', correct_answer: true, category: algo, difficulty: 'Medium' },
      { text: 'Can Dijkstra\'s algorithm handle negative edge weights?', correct_answer: false, category: algo, difficulty: 'Hard' },
    ];

    await Question.insertMany(questions);
    console.log('Questions seeded.');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();