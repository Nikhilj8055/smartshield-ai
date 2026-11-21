import '../config';
import { Pool } from 'pg';


export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', (error) => {
    console.error('[DATABASE ERROR]', error.message);
});

export async function testDatabaseConnection(): Promise<void> {
    const client = await pool.connect();

    try {
        const result = await client.query('SELECT NOW()');
        console.log('PostgreSQL connected:', result.rows[0].now);
    } finally {
        client.release();
    }
}
