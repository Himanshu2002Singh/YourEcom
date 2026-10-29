// Creates the database named in DATABASE_URL (if missing), its tables and the storefront's
// products. The API also creates missing tables on its own (db/pool.js); this is for a
// brand-new database or a manual check.
// Usage: npm run db:setup   (reads backend/.env)
import mysql from 'mysql2/promise';
import { SCHEMA } from './schema.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is missing. Add it to backend/.env, e.g. mysql://root:PASSWORD@localhost:3306/yourecom');
  process.exit(1);
}

const target = new URL(url);
const database = decodeURIComponent(target.pathname.slice(1));
if (!/^\w+$/.test(database)) {
  console.error('DATABASE_URL must end with a database name made of letters, numbers or underscores, e.g. /yourecom');
  process.exit(1);
}
target.pathname = '/';

const server = await mysql.createConnection({ uri: target.toString(), multipleStatements: true });
await server.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await server.query(`USE \`${database}\``);
await server.query(SCHEMA);
const [tables] = await server.query('SHOW TABLES');
const [[{ products }]] = await server.query('SELECT COUNT(*) AS products FROM products');
console.log(`Database "${database}" ready with tables: ${tables.map(row => Object.values(row)[0]).join(', ')} (${products} products)`);
await server.end();
