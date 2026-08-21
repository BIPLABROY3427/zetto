import fs from 'fs';
const file = '/Users/biplab/Desktop/getway/server/controllers/userController.mjs';
let content = fs.readFileSync(file, 'utf8');

const createUserStr = `
// Create a new user (Directly by Admin/Superadmin without OTP)
// Accessible by: superadmin
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ status: false, message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: true, // Auto verified
      role: role || 'user',
      apiKeys: [{
        key: crypto.randomBytes(32).toString('hex'),
        name: 'Default API Key',
        isActive: true,
        createdAt: new Date()
      }]
    });

    res.status(201).json({ status: true, message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ status: false, message: 'Server error creating user' });
  }
};
`;

content += createUserStr;
fs.writeFileSync(file, content);
console.log('Added createUser to userController.mjs');
