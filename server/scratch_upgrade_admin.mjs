import mongoose from 'mongoose';
import Config from './config/config.mjs';
import User from './models/User.mjs';

async function upgrade() {
  await Config();
  const res = await User.updateOne({ email: 'biplabroy3427@gmail.com' }, { role: 'superadmin' });
  console.log(res);
  process.exit(0);
}
upgrade();
