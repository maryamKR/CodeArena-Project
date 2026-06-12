require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Question = require('../models/Question');
const User = require('../models/User');

const categories = [
  { name: 'JavaScript', slug: 'js', color: '#e6db74' },
  { name: 'Python', slug: 'py', color: '#66d9e8' },
  { name: 'SQL', slug: 'sql', color: '#f92672' },
  { name: 'HTML/CSS', slug: 'html', color: '#e34c26' },
  { name: 'Algorithms', slug: 'algo', color: '#a6e22e' },
  { name: 'React', slug: 'react', color: '#61dafb' },
  { name: 'Node.js', slug: 'node', color: '#8cc84b' },
  { name: 'DevOps', slug: 'devops', color: '#ff9900' },
  { name: 'Git', slug: 'git', color: '#f14e32' },
  { name: 'Docker', slug: 'docker', color: '#2496ed' },
];

/** Build question list after categories are resolved */
const buildQuestions = (catMap) => [

  // ── JavaScript (10 questions) ──────────────────────────────────────────────
  { text: 'In JavaScript, `typeof null` returns "object".', correct_answer: true, category: catMap['js'], difficulty: 'Easy' },
  { text: '`===` in JavaScript checks both value and type.', correct_answer: true, category: catMap['js'], difficulty: 'Easy' },
  { text: 'JavaScript is a statically typed language.', correct_answer: false, category: catMap['js'], difficulty: 'Easy' },
  { text: 'Arrow functions have their own `this` binding.', correct_answer: false, category: catMap['js'], difficulty: 'Medium' },
  { text: '`Promise.all()` rejects as soon as any one promise rejects.', correct_answer: true, category: catMap['js'], difficulty: 'Medium' },
  { text: 'Variables declared with `var` are block-scoped.', correct_answer: false, category: catMap['js'], difficulty: 'Medium' },
  { text: 'Closures can access variables from their outer scope even after that scope has returned.', correct_answer: true, category: catMap['js'], difficulty: 'Medium' },
  { text: 'The event loop processes the call stack and callback queue synchronously at the same time.', correct_answer: false, category: catMap['js'], difficulty: 'Hard' },
  { text: 'In JavaScript, `0 == false` evaluates to true.', correct_answer: true, category: catMap['js'], difficulty: 'Hard' },
  { text: 'Generator functions pause at each `yield` and resume lazily.', correct_answer: true, category: catMap['js'], difficulty: 'Hard' },

  // ── Python (10 questions) ──────────────────────────────────────────────────
  { text: 'In Python, lists are mutable but tuples are immutable.', correct_answer: true, category: catMap['py'], difficulty: 'Easy' },
  { text: 'Python uses curly braces `{}` to define code blocks.', correct_answer: false, category: catMap['py'], difficulty: 'Easy' },
  { text: 'The `range()` function in Python 3 returns a list.', correct_answer: false, category: catMap['py'], difficulty: 'Easy' },
  { text: 'Python supports multiple inheritance.', correct_answer: true, category: catMap['py'], difficulty: 'Medium' },
  { text: 'Dictionary keys in Python must be immutable.', correct_answer: true, category: catMap['py'], difficulty: 'Medium' },
  { text: 'In Python, `is` and `==` always produce the same result.', correct_answer: false, category: catMap['py'], difficulty: 'Medium' },
  { text: 'A Python `set` can contain duplicate values.', correct_answer: false, category: catMap['py'], difficulty: 'Medium' },
  { text: 'The GIL in CPython prevents true multi-threaded parallelism for CPU-bound tasks.', correct_answer: true, category: catMap['py'], difficulty: 'Hard' },
  { text: 'The `@staticmethod` decorator gives the method access to the class via `cls`.', correct_answer: false, category: catMap['py'], difficulty: 'Hard' },
  { text: 'List comprehensions are generally faster than equivalent `for` loops appending to a list.', correct_answer: true, category: catMap['py'], difficulty: 'Hard' },

  // ── SQL (10 questions) ─────────────────────────────────────────────────────
  { text: 'SQL stands for Structured Query Language.', correct_answer: true, category: catMap['sql'], difficulty: 'Easy' },
  { text: 'The `WHERE` clause filters rows before grouping in a `GROUP BY` query.', correct_answer: true, category: catMap['sql'], difficulty: 'Easy' },
  { text: 'A `FOREIGN KEY` can reference any column in any table.', correct_answer: false, category: catMap['sql'], difficulty: 'Easy' },
  { text: '`INNER JOIN` returns rows only when there is a match in both tables.', correct_answer: true, category: catMap['sql'], difficulty: 'Medium' },
  { text: '`HAVING` filters rows before the `GROUP BY` aggregation is applied.', correct_answer: false, category: catMap['sql'], difficulty: 'Medium' },
  { text: 'A `NULL` value in SQL is the same as zero or an empty string.', correct_answer: false, category: catMap['sql'], difficulty: 'Medium' },
  { text: '`DISTINCT` removes duplicate rows from the result set.', correct_answer: true, category: catMap['sql'], difficulty: 'Medium' },
  { text: 'A clustered index physically sorts the rows of a table on disk.', correct_answer: true, category: catMap['sql'], difficulty: 'Hard' },
  { text: 'Transactions guarantee ACID: Atomicity, Consistency, Isolation, Durability.', correct_answer: true, category: catMap['sql'], difficulty: 'Hard' },
  { text: 'You can use `SUM()` directly in a `WHERE` clause without a subquery.', correct_answer: false, category: catMap['sql'], difficulty: 'Hard' },

  // ── HTML/CSS (10 questions) ────────────────────────────────────────────────
  { text: 'HTML stands for HyperText Markup Language.', correct_answer: true, category: catMap['html'], difficulty: 'Easy' },
  { text: 'The `<header>` tag in HTML5 can only appear once per page.', correct_answer: false, category: catMap['html'], difficulty: 'Easy' },
  { text: 'CSS `inline` display elements start on a new line.', correct_answer: false, category: catMap['html'], difficulty: 'Easy' },
  { text: 'In the CSS box model, `padding` is inside the border and `margin` is outside.', correct_answer: true, category: catMap['html'], difficulty: 'Medium' },
  { text: 'CSS Flexbox and CSS Grid cannot be used together on the same layout.', correct_answer: false, category: catMap['html'], difficulty: 'Medium' },
  { text: 'Setting `position: absolute` removes an element from the normal document flow.', correct_answer: true, category: catMap['html'], difficulty: 'Medium' },
  { text: 'The CSS `z-index` property works on elements with `position: static`.', correct_answer: false, category: catMap['html'], difficulty: 'Medium' },
  { text: 'CSS custom properties (variables) are inherited by child elements by default.', correct_answer: true, category: catMap['html'], difficulty: 'Hard' },
  { text: 'The `<canvas>` element is fully accessible to screen readers by default.', correct_answer: false, category: catMap['html'], difficulty: 'Hard' },
  { text: 'A CSS `@media` query can target both screen width and device orientation simultaneously.', correct_answer: true, category: catMap['html'], difficulty: 'Hard' },

  // ── Stub questions for remaining 6 categories (3 each) ────────────────────
  ...['algo', 'react', 'node', 'devops', 'git', 'docker'].flatMap(slug => [
    { text: `Is this an Easy question about ${slug}?`, correct_answer: true, category: catMap[slug], difficulty: 'Easy' },
    { text: `Is this a Medium question about ${slug}?`, correct_answer: false, category: catMap[slug], difficulty: 'Medium' },
    { text: `Is this a Hard question about ${slug}?`, correct_answer: true, category: catMap[slug], difficulty: 'Hard' },
  ]),
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    await Category.deleteMany({});
    await Question.deleteMany({});
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('Database cleared.');

    const createdCategories = await Category.insertMany(categories);
    const catMap = {};
    createdCategories.forEach(c => { catMap[c.slug] = c._id; });
    console.log(`📂 ${createdCategories.length} categories seeded.`);

    const questions = buildQuestions(catMap);
    await Question.insertMany(questions);
    console.log(`❓ ${questions.length} questions seeded.`);

    const users = [
      { username: 'rookie_dev', email: 'rookie@example.com', password: 'password123', totalXP: 150, rank: 'Beginner', isOnline: true },
      { username: 'mid_coder', email: 'mid@example.com', password: 'password123', totalXP: 2500, rank: 'Intermediate', isOnline: false },
      { username: 'pro_hacker', email: 'pro@example.com', password: 'password123', totalXP: 8000, rank: 'Advanced', isOnline: true },
      { username: 'algo_master', email: 'master@example.com', password: 'password123', totalXP: 15000, rank: 'Master', badges: ['First Blood', 'Speedster'], isOnline: false },
      { username: 'js_ninja', email: 'js@example.com', password: 'password123', totalXP: 5500, rank: 'Advanced', isOnline: true },
    ];

    users[0].categoryXP = { [catMap['js']]: 100, [catMap['html']]: 50 };
    users[1].categoryXP = { [catMap['py']]: 1000, [catMap['sql']]: 1500 };
    users[2].categoryXP = { [catMap['algo']]: 4000, [catMap['docker']]: 4000 };
    users[3].categoryXP = { [catMap['algo']]: 10000, [catMap['py']]: 5000 };
    users[4].categoryXP = { [catMap['js']]: 5000, [catMap['react']]: 500 };

    for (const u of users) await User.create(u);
    console.log(`👤 ${users.length} mock users seeded.`);

    console.log('\n🎉 Seed complete!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();