import pool from "../config/db";
import checklistModel, { ChecklistRow } from "../models/checklistModel";
import boardMemberModel from "../models/boardMemberModel";
import taskModel from "../models/taskModel";

const checklistService = {
    checkAccessByTaskId: async (taskId: number, userId: number) => {
        const task = await taskModel.findByTaskId(taskId);
        if (!task) throw { status: 404, message: 'Task not found.'};

        const isMember = await boardMemberModel.memberCheckByListId(task.list_id, userId);
        if (!isMember) {
            throw { status: 403, message: 'Access denied. You are not a member of this board' }
        };

        return task;
    },

    getChecklist: async (taskId: number, userId: number) : Promise<ChecklistRow[]> => {
        await checklistService.checkAccessByTaskId(taskId, userId);
        return checklistModel.findByTask(taskId);
    },

    createItem: async (taskId: number, content: string, userId: number) : Promise<ChecklistRow> => {
        await checklistService.checkAccessByTaskId(taskId, userId);
        
        const nextPosition = await checklistModel.findNextPosition(taskId);
        const newItem = await checklistModel.create(taskId, content, nextPosition)
        return newItem;
    },

    updateItem: async (checklistId: number, taskId: number, content: string | undefined, is_done: boolean | undefined, userId: number): Promise<ChecklistRow> => {
        await checklistService.checkAccessByTaskId(taskId, userId);

        const updated = await checklistModel.updateItem(checklistId, taskId, content, is_done);
        if (!updated) throw { status: 404, message: 'Checklist item not found.'}
        return updated;
    },

    deleteItem: async (checklistId: number, taskId: number, userId: number) : Promise<ChecklistRow> => {
        await checklistService.checkAccessByTaskId(taskId, userId);
        
        try{
            await pool.query('BEGIN');
    
            const deletedItem = await checklistModel.delete(checklistId, taskId);
            if (!deletedItem) throw { status: 404, message: 'Checklist item not found.'}
            const deletedPosition = deletedItem.position;
    
            await checklistModel.updatePositionAfterDelete(taskId, deletedPosition);
            await pool.query('COMMIT');
            return deletedItem;
        } catch (error){
            await pool.query('ROLLBACK');
            throw error;
        }
    },

    reorderItem: async (checklistId: number, taskId: number, newPosition: number, userId: number) : Promise<void> => {
        await checklistService.checkAccessByTaskId(taskId, userId);

        //validate newPosition hop le
        if (typeof newPosition !== 'number' || isNaN(newPosition)) {
            throw { status: 400, message: 'newPosition is required.' }
        }

        const maxPosition = await checklistModel.findMaxPosition(taskId);
        if (newPosition < 0 || newPosition > maxPosition) {
            throw { status: 400, message: 'Position out of range.'}
        }

        const oldPosition = await checklistModel.findCurrentPosition(checklistId, taskId);
        if (oldPosition === null || oldPosition === undefined){
            throw { status: 400, message: 'Checklist item not found.'}
        };

        if (oldPosition === newPosition) return;
        
        try {
            await pool.query('BEGIN');
            await checklistModel.updatePositionAfterMove(taskId, checklistId, oldPosition, newPosition);
            await pool.query('COMMIT');
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    },
};

export default checklistService;