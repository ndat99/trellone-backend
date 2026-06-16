import { Pool } from 'pg';  //thu vien ket noi postgres
import dotenv from 'dotenv';  //doc file .env

dotenv.config(); // lenh doc file .env

//tao pool ket noi csdl
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});
export default pool;