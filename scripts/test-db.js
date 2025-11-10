const { Pool } = require('pg');
require('dotenv').config();

async function testDatabase() {
  console.log('🔍 Testing Supabase connection...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT NOW() as time');
    
    console.log('✅ Database connected!');
    console.log('⏰ Server time:', result.rows[0].time);
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Tables:', tables.rows.length);
    tables.rows.forEach(row => console.log('  -', row.table_name));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDatabase();
