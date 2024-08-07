// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const UserModel = require('./Models/User');
const TodoModel = require('./Models/Todo');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

const corsConfig ={
  origin:"*",
  credential: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
}
app.options(cors(corsConfig))

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log(err));


//mongoose.connect('mongodb://127.0.0.1:27017/test');

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new UserModel({ email, password });
    await user.save();
    res.status(201).send({ message: 'User registered' });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.send({ token });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Middleware to check token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send({ message: 'No token provided' });

  jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
    if (err) return res.status(401).send({ message: 'Failed to authenticate token' });
    req.userId = decoded.id;
    next();
  });
};

// Protected routes
app.get('/get', authenticate, (req, res) => {
  TodoModel.find()
    .then(result => res.json(result))
    .catch(err => res.json(err));
});

app.post('/add', authenticate, (req, res) => {
  const task = req.body.task;
  TodoModel.create({ task })
    .then(result => res.json(result))
    .catch(err => res.json(err));
});

app.put('/update/:id', authenticate, (req, res) => {
  const { id } = req.params;
  TodoModel.findByIdAndUpdate({ _id: id }, { done: true })
    .then(result => res.json(result))
    .catch(err => res.json(err));
});

app.delete('/delete/:id', authenticate, (req, res) => {
  const { id } = req.params;
  TodoModel.findByIdAndDelete({ _id: id })
    .then(result => res.json(result))
    .catch(err => res.json(err));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});