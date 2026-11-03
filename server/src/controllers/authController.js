import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    let userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const fullName = `${firstName} ${lastName}`;
    const user = await User.create({
      name: fullName,
      email,
      password: hashedPassword,
      role,
    });

    // Create empty accompanying developer/client profile
    await Profile.create({
      user: user._id,
      title: role === 'developer' ? 'Software Developer' : 'Project Owner',
      about: 'Welcome to your workspace profile! Edit to details.',
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};
