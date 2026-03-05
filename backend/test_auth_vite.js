const fetch = global.fetch;

async function doPost(url, creds) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const text = await res.text();
    console.log(`${url} -> ${res.status} ${res.statusText}`);
    console.log(text);
  } catch (e) {
    console.error(`${url} error:`, e.message);
  }
}

async function run() {
  const creds = { email: 'test2@example.com', password: 'password123' };
  await doPost('http://localhost:5000/api/auth/register', creds);
  await doPost('http://localhost:5000/api/auth/login', creds);
  console.log('\n--- Now via Vite dev server (5173) ---');
  await doPost('http://localhost:5173/api/auth/register', creds);
  await doPost('http://localhost:5173/api/auth/login', creds);
}

run();
