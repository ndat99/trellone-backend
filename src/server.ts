import express, { Request, Response } from 'express'; //framework web 
import cors from 'cors';  //cho phep domain khac goi backend port nay
import { Pool } from 'pg';  //thu vien ket noi postgres
import dotenv from 'dotenv';  //doc file .env

dotenv.config(); // lenh doc file .env

const app = express();  //khoi tao ud express
app.use(cors()); //cho phep domain khac goi API
app.use(express.json()) //dich JSON tu frontend

//tao pool ket noi csdl
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

//test ket noi
pool.connect((err, client, release) => {
  if (err){
    return console.error('Error: Can not connect to PostgreSQL: ',err.stack);
  }
  console.log('Connect to PostgreSQL successful');
  release();
});


//dinh nghia api route va lang nghe
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Express Server is running'});
});

//khai bao port
const PORT = process.env.PORT || 3636;
app.listen(PORT, () =>{
  console.log(`Server is running on http://localhost:${PORT}`);
});