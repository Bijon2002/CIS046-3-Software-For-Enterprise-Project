(async()=>{
  const fetchFn = global.fetch;
  const urls = [
    'http://localhost:5000/api/game/leaderboard',
    'http://localhost:5173/api/game/leaderboard'
  ];
  for (const u of urls) {
    try {
      const r = await fetchFn(u);
      const t = await r.text();
      console.log(u, '=>', r.status);
      console.log(t);
    } catch (e) {
      console.error('Error', u, e.message);
    }
    console.log('\n---');
  }
})();
