import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import bcrypt from 'bcrypt';
import pool from '../config/db';


export const signup = async ( req: Request, res: Response) : Promise<void> => {
    try {
        const { username, email, password, name } = req.body;
        const saltRounds = 10; //10 vong
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO users (username, email, password_hash, name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, name, created_at;
        `;

        const values = [username, email, passwordHash, name];
        const result = await pool.query(query, values);

        const newUser = result.rows[0];
        res.status(201).json({
            message: 'Account registered successfully!',
            user: newUser
        });
    } catch (error: any) {
        console.error('Signup error:', error);

        //trung username/email
        if (error.code === '23505'){
            res.status(400).json({
                message: 'The username or email address already exists!'
            });
            return;
        }

        //loi khac
        res.status(500).json({
            message: 'Internal Server error'
        });
    }
};

export const login = async (req: Request, res: Response) : Promise<void> => {
    try{
        const {username, password} = req.body;
        const query = `
            SELECT * FROM users WHERE username = $1
        `;
        const result = await pool.query(query, [username]);

        if (result.rows.length === 0) {
            res.status(401).json({
                message: 'Username not found!'
            });
            return;
        }
        
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch){
            res.status(401).json({
                message: 'Incorrect password!'
            });
            return;
        }

        //cap token
        const secretKey = process.env.JWT_SECRET || 'fallback_secret';
        const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1d'});
        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name
            }
        });
    } catch (error: any){
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Internal Server error'
        });
    };
}

export const getMe = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const userId = req.user.id;
        const query = `
            SELECT id, username, email, created_at FROM users WHERE id = $1
        `
        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            res.status(401).json({
                message: `User not found`
            });
            return;
        }
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({
            message: 'Server error:', error
        });
    }
};