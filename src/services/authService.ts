import userModel, {UserRow} from '../models/userModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export type LoginResult = {
    token: string,
    user: {
        id: number,
        username: string,
        email: string,
        name: string
    };
}

const authService = {
    // Controller truyền password thô, Service chịu trách nhiệm hash
    signup: async (username: string, email: string, password: string, name: string): Promise<UserRow> => {
        try {
            const saltRounds = 10; //10 vong
            const passwordHash = await bcrypt.hash(password, saltRounds);
            return userModel.create(username, email, passwordHash, name);
        } catch (error: any){
            //trung username/email
            if (error.code === '23505'){
                throw { status: 400, message: 'The username or email address already exists!'
                };
            }
            throw error;
        }
    },

    login: async (username: string, password: string) : Promise<LoginResult> => {
        const user = await userModel.getByUsername(username);
        if (!user) {
            throw { status: 401, message: 'Invalid username or password.'};
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch){
            throw { status: 401, message: 'Invalid username or password.'};
        }
        //cap token
        const secretKey = process.env.JWT_SECRET;
        const token = jwt.sign({ id: user.id }, secretKey!, {expiresIn: '7d'}); //7 days
        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name
            }
        };
    },

    getMe: async (userId: number) : Promise<UserRow> => {
        const user = await userModel.getById(userId);
        if (!user) {
            throw { status: 404, message: 'User not found.'}
        }
        return user;
    }
};

export default authService;