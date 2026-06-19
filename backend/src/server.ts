import express, { Request, Response } from 'express'; //framework web 
import cors from 'cors';  //cho phep domain khac goi backend port nay
import authRoutes from './routes/authRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import boardRoutes from './routes/boardRoutes';
import pool from './config/db';


const app = express();  //khoi tao ud express
app.use(cors()); //cho phep domain khac goi API
app.use(express.json()) //dich JSON tu frontend
app.use('/api/auth', authRoutes); //signup API
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);

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