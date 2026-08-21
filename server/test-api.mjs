import axios from 'axios';
(async () => {
  try {
    const loginRes = await axios.post('http://localhost:5872/api/auth/login', {
      email: 'biplabroy3427@gmail.com',
      password: '200010379'
    });
    const token = loginRes.data.token;
    console.log('Token acquired');

    try {
      const healthRes = await axios.get('http://localhost:5872/api/v1/gateway/system/health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Health:', healthRes.data);
    } catch (e) {
      console.error('Health Error:', e.response?.data || e.message);
    }

    try {
      const analyticsRes = await axios.get('http://localhost:5872/api/dashboard/admin/analytics?days=7', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Analytics:', analyticsRes.data);
    } catch (e) {
      console.error('Analytics Error:', e.response?.data || e.message);
    }
  } catch (e) {
    console.error('Login Error:', e.response?.data || e.message);
  }
})();
