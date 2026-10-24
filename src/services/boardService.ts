import pool from '../config/db';
import boardMemberModel from '../models/boardMemberModel';
import boardModel, { BoardRow, BoardWithRole } from '../models/boardModel';

const boardService = {
    getBoardByWorkspace: async (userId: number, workspaceId: number) : Promise<BoardWithRole[]> => {
        return boardModel.findByWorkspace(userId, workspaceId);
    },

    getBoardById: async (userId: number, boardId: number): Promise<BoardWithRole> => {
        const board = await boardModel.findById(userId, boardId);
        if (!board) {
            throw { status: 404, message: 'Board not found or access denied.'}
        }
        return board;
    },

    createBoard: async (userId: number, name: string, workspaceId: number) : Promise<BoardRow> => {
        const client = await pool.connect();
        try{
            await client.query('BEGIN');
            const newBoard = await boardModel.create(name, workspaceId, client);
            await boardMemberModel.addOwner(newBoard.id, userId, client);

            await client.query('COMMIT');
            return newBoard;
        } catch (error){
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    updateBoard: async (name: string, bgColor: string, bgImgUrl: string, userId: number, boardId: number) : Promise<BoardRow> => {
        const board = await boardModel.update(name, bgColor, bgImgUrl, boardId, userId);
        if (!board) {
            throw { status: 404, message: 'Board not found or access denied.'}
        }
        return board
    },

    deleteBoard: async (boardId: number, userId: number) : Promise<BoardRow> => {
        const deleted = await boardModel.delete(boardId, userId);
        if (!deleted) {
            throw { status: 404, message: 'Board not found or access denied.'}
        }
        return deleted;
    }
};

export default boardService;