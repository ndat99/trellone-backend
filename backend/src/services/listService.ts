import pool from "../config/db";
import listModel, { ListRow } from "../models/listModel";
import boardMemberModel from "../models/boardMemberModel";

const listService = {
    checkMember: async (boardId: number, userId: number) : Promise<void> => {
        const isMember = await boardMemberModel.memberCheck(boardId, userId);
        if (!isMember){
            throw { status: 403, message: 'Access denied. You are not a member of this board'}
        }
    },
    
    getList: async (boardId: number, userId: number) : Promise<ListRow[]> => {
        await listService.checkMember(boardId, userId);

        return listModel.findByBoard(boardId);
    },

    createList: async (boardId: number, name: string, userId: number) : Promise<ListRow> => {
        await listService.checkMember(boardId, userId);
        
        const nextPosition = await listModel.findNextPosition(boardId);
        const newList = await listModel.create(boardId, name, nextPosition)
        return newList;
    },

    updateListName: async (boardId: number, name: string, listId: number, userId: number): Promise<ListRow> => {
        await listService.checkMember(boardId, userId);

        const list = await listModel.rename(name, listId, boardId);
        if (!list){
            throw { status: 404, message: 'List not found or access denied.'}
        }
        return list;
    },

    deleteList: async (boardId: number, userId: number, listId: number) : Promise<ListRow> => {
        await listService.checkMember(boardId, userId);
        
        try{
            await pool.query('BEGIN');
    
            const deletedList = await listModel.delete(listId, boardId);
            if (!deletedList) {
                throw { status: 404, message: 'List not found.'}
            }
            const deletedPosition = deletedList.position;
    
            await listModel.updatePositionAfterDelete(boardId, deletedPosition);
            await pool.query('COMMIT');
            return deletedList;
        } catch (error){
            await pool.query('ROLLBACK');
            throw error;
        }
    },

    reorderList: async (boardId: number, listId: number, newPosition: number, userId: number) : Promise<void> => {
        await listService.checkMember(boardId, userId);
        //validate newPosition hop le
        if (newPosition === undefined || newPosition === null) {
            throw { status: 400, message: 'newPosition is required.' }
        }

        const maxPosition = await listModel.findMaxPosition(boardId);
        if (newPosition < 0 || newPosition > maxPosition) {
            throw { status: 400, message: 'Position out of range.'}
        }

        const oldPosition = await listModel.findCurrentPosition(listId, boardId);
        if (oldPosition === null || oldPosition === undefined){
            throw { status: 400, message: 'List not found or access denied.'}
        }

        if (oldPosition === newPosition) {
            return;
        }
        
        try {

            await pool.query('BEGIN');
            await listModel.updatePositionAfterMove(boardId, listId, oldPosition, newPosition);
            await pool.query('COMMIT');
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    }
};

export default listService;