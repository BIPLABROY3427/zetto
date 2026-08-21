import { randomBytes } from 'crypto';
export const generateApiKey = () => {
  const secret = randomBytes(32).toString('hex');
  return secret;
};
