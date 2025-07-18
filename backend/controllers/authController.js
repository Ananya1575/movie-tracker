const jwt = require('jsonwebtoken');
const User = require('./../models/User.js');

exports.signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        console.log('Signup attempt for:', email);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ name, email, password });
        await user.save();
        console.log('User created:', email);

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('Login attempt for:', email);
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Invalid password for:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};