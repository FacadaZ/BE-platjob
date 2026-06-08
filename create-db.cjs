const { Client } = require('pg');
async function run() {
  const c = new Client({ connectionString: 'postgresql://postgres:root@127.0.0.1:5432/postgres' });
  await c.connect();
  try {
    await c.query('CREATE DATABASE platjob');
    console.log('Database platjob created');
  } catch (e) {
    if (e.code === '42P04') {
      console.log('Database already exists');
    } else {
      console.error(e);
      process.exit(1);
    }
  }
  await c.end();
  process.exit(0);
}
run();