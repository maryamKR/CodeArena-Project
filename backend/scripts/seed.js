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
    const questions = [
      {
        text: 'Is JavaScript a dynamically typed language?',
        correct_answer: true,
        category: createdCategories.find(c => c.slug === 'js')._id,
        difficulty: 'Easy'
      },
      {
        text: 'Does Python use indentation to define code blocks?',
        correct_answer: true,
        category: createdCategories.find(c => c.slug === 'py')._id,
        difficulty: 'Easy'
      }
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