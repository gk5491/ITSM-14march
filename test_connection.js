import { connection } from './server/db.js';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log('✅ Connection successful!');
    console.log(`Found ${rows[0].count} users in the database.`);
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log(` - ${Object.values(table)[0]}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
