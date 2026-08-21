import mongoose from 'mongoose';
import Config from './config/config.mjs';
import User from './models/User.mjs';

async function check() {
  await Config();
  const users = await User.find({}, 'email name role');
  console.log(users);
  process.exit(0);
}
check();
