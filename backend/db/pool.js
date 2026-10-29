import mysql from 'mysql2/promise';
import { HttpError } from '../utils/HttpError.js';
import { SCHEMA } from './schema.js';

let pool;
let tablesReady; // settles once SCHEMA has run in this process

function databaseUrl() {
  if (!process.env.DATABASE_URL) throw new HttpError(503, 'The store’s database isn’t set up on this server yet.');
  return process.env.DATABASE_URL;
}

// One shared MySQL pool, from DATABASE_URL (mysql://user:password@host:3306/yourecom).
// MySQL hands TIMESTAMP columns back in the session's time zone, so every connection is
// switched to UTC to match `timezone: 'Z'`; otherwise a server set to IST shifts every time.
export function db() {
  if (!pool) {
    pool = mysql.createPool({ uri: databaseUrl(), connectionLimit: 5, timezone: 'Z' });
    pool.on('connection', connection => connection.query("SET time_zone = '+00:00'", error => error && console.error(error)));
  }
  return pool;
}

// Creates any missing tables (and the seeded products) the first time this process touches the
// database (after a start, restart or deploy). SCHEMA only adds what's missing, so running it
// again changes nothing. If it fails, the next query tries again.
export function ensureTables() {
  tablesReady ??= (async () => {
    const connection = await mysql.createConnection({ uri: databaseUrl(), multipleStatements: true });
    try {
      await connection.query(SCHEMA);
    } finally {
      await connection.end();
    }
  })().catch(error => {
    tablesReady = undefined;
    throw error;
  });
  return tablesReady;
}

export async function query(sql, params = []) {
  await ensureTables();
  const [rows] = await db().execute(sql, params);
  return rows;
}

// Runs work(connection) as one transaction: committed if it returns, rolled back if it throws.
export async function transaction(work) {
  await ensureTables();
  const connection = await db().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// For tests and graceful shutdown: lets the process exit.
export async function closeDb() {
  await pool?.end();
  pool = undefined;
}
