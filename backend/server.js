const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const User = mongoose.model('User', UserSchema);

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      if (roles.length && !roles.includes(user.role)) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };
};

app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashed, role });
  await newUser.save();
  res.send({ message: 'User registered' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.send({ token });
});

app.get('/api/users', authMiddleware(['admin']), async (req, res) => {
  const users = await User.find({}, '-password');
  res.send(users);
});

app.get('/api/profile', authMiddleware(), async (req, res) => {
  const user = await User.findById(req.user.id, '-password');
  res.send(user);
});

// Admin CRUD APIs
app.post('/api/users', authMiddleware(['admin']), async (req, res) => {
  const { username, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed, role });
  await user.save();
  res.send({ message: 'User created' });
});

app.put('/api/users/:id', authMiddleware(['admin']), async (req, res) => {
  const { username, role } = req.body;
  await User.findByIdAndUpdate(req.params.id, { username, role });
  res.send({ message: 'User updated' });
});

app.delete('/api/users/:id', authMiddleware(['admin']), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.send({ message: 'User deleted' });
});

app.listen(5000, () => console.log('Server running on port 5000'));