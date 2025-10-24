const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Add decisionStyle to token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      career: user.career,
      AL_stream: user.AL_stream,
      decisionStyle: user.decisionStyle || null
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register new user
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      AL_stream: user.AL_stream,
      career: user.career,
      decisionStyle: user.decisionStyle || null,
      token: generateToken(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update profile with decisionStyle too
exports.updateProfile = async (req, res) => {
  try {
    const { AL_stream, specialization, career, decisionStyle } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (AL_stream) user.AL_stream = AL_stream;
    if (specialization) user.specialization = specialization;
    if (career) user.career = career;
    if (decisionStyle) user.decisionStyle = decisionStyle;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      AL_stream: user.AL_stream,
      specialization: user.specialization,
      career: user.career,
      decisionStyle: user.decisionStyle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
