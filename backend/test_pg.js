const { Client } = require('pg');

const passwords = ['postgres', 'admin', 'password', 'root', '', '123456', '1234'];

async function test() {
  for (const pwd of passwords) {
    const client = new Client({
      user: 'postgres',
      password: pwd,
      host: 'localhost',
      port: 5432,
      database: 'postgres'
    });
    try {
      await client.connect();
      console.log('SUCCESS with password:', pwd);
      await client.end();
      return;
    } catch (err) {
      console.log('FAILED with password:', pwd);
      // console.error(err.message);
    }
  }
}
test();
