const fetch = global.fetch || require('node-fetch');

async function run() {
  const base = 'http://localhost:5000/api/auth';
  const creds = { email: 'test@example.com', password: 'password123' };

  try {
    console.log('POST /register');
    let res = await fetch(base + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  } catch (e) {
    console.error('Register error:', e.message);
  }

  try {
    console.log('\nPOST /login');
    let res = await fetch(base + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  } catch (e) {
    console.error('Login error:', e.message);
  }
}

run();
