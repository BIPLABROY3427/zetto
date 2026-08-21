(async () => {
  try {
    const loginRes = await fetch('http://localhost:5872/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'biplabroy3427@gmail.com', password: '200010379' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Token acquired', !!token);

    if (token) {
        const analyticsRes = await fetch('http://localhost:5872/api/dashboard/admin/analytics?days=7', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await analyticsRes.json();
        console.log('Analytics Response Success:', data.success);
        console.log('Top Merchants count:', data.topMerchants?.length);
        console.log('All Merchants count:', data.allMerchantsStats?.length);
    }
  } catch (e) {
    console.error('Test Error:', e);
  }
})();
