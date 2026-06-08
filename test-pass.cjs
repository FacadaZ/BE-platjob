const { Client } = require('pg');
const passwords = ['1234', '12345', '123456', 'root', 'admin', 'password', ''];
async function check() {
  for (const p of passwords) {
    try {
      const c = new Client({ connectionString: `postgresql://postgres:${p}@127.0.0.1:5432/postgres`});
      await c.connect();
      console.log('Success with: ' + p);
      process.exit(0);
    } catch(e) {
      // ignore
    }
  }
  console.log('All failed');
  process.exit(1);
}
check();