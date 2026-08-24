import pool from "../config/db";
import taskModel, { TaskRow } from "../models/taskModel";
import boardMemberModel from "../models/boardMemberModel";
import listModel from "../models/listModel";

const taskService = {
    checkMemberByListId: async (listId: number, userId: number) : Promise<void> => {
        const isMember = await boardMemberModel.memberCheckByListId(listId, userId);
        if (!isMember){
            throw { status: 403, message: 'Access denied. You are not a member of this board'}
        }
    },
    
    getTask: async (listId: number, userId: number) : Promise<TaskRow[]> => {
        await taskService.checkMemberByListId(listId, userId);

        return taskModel.findByList(listId);
    },

    getTaskById: async (taskId: number, userId: number) : Promise<TaskRow> => {
        const task = await taskModel.findByTaskId(taskId);
        if (!task) throw { status: 404, message: 'Task not found.'};

        await taskService.checkMemberByListId(task.list_id, userId);
        return task;
    },

    createTask: async (listId: number, name: string, userId: number) : Promise<TaskRow> => {
        await taskService.checkMemberByListId(listId, userId);
        
        const nextPosition = await taskModel.findNextPosition(listId);
        const newtask = await taskModel.create(listId, name, nextPosition, userId)
        return newtask;
    },

    updateDetails: async (fields: object, taskId: number, userId: number): Promise<TaskRow> => {
        const existing = await taskModel.findByTaskId(taskId);
        if (!existing) throw { status: 404, message: 'Task not found.'};

        await taskService.checkMemberByListId(existing.list_id, userId);

        const task = await taskModel.update(taskId, existing.list_id, fields);
        if (!task) throw { status: 404, message: 'Task not found or access denied.'}
        return task;
    },

    toggleArchiveTask: async (taskId: number, userId: number): Promise<TaskRow> => {
        const existing = await taskModel.findByTaskId(taskId);
        if (!existing) throw { status: 404, message: 'Task not found.'};

        await taskService.checkMemberByListId(existing.list_id, userId);

        const task = await taskModel.toggleArchive(taskId, existing.list_id);
        if (!task) throw { status: 404, message: 'Task not found or access denied.'}
        return task;
    },

    deleteTask: async (userId: number, taskId: number) : Promise<TaskRow> => {
        const existing = await taskModel.findByTaskId(taskId);
        if (!existing) throw { status: 404, message: 'Task not found.' };
        await taskService.checkMemberByListId(existing.list_id, userId);
        
        try{
            await pool.query('BEGIN');
    
            const deletedtask = await taskModel.delete(taskId, existing.list_id);
            if (!deletedtask) throw { status: 404, message: 'Task not found.'}
            const deletedPosition = deletedtask.position;
    
            await taskModel.updatePositionAfterDelete(existing.list_id, deletedPosition);
            await pool.query('COMMIT');
            return deletedtask;
        } catch (error){
            await pool.query('ROLLBACK');
            throw error;
        }
    },

    reorderTask: async (taskId: number, newPosition: number, userId: number) : Promise<void> => {
        const existing = await taskModel.findByTaskId(taskId);
        if (!existing) throw { status: 404, message: 'Task not found.' };
        await taskService.checkMemberByListId(existing.list_id, userId);

        //validate newPosition hop le
        if (typeof newPosition !== 'number' || isNaN(newPosition)) {
            throw { status: 400, message: 'newPosition is required.' }
        }

        const maxPosition = await taskModel.findMaxPosition(existing.list_id);
        if (newPosition < 0 || newPosition > maxPosition) {
            throw { status: 400, message: 'Position out of range.'}
        }

        const oldPosition = existing.position;
        if (oldPosition === null || oldPosition === undefined){
            throw { status: 400, message: 'Task not found or access denied.'}
        }

        if (oldPosition === newPosition) {
            return;
        }
        
        try {
            await pool.query('BEGIN');
            await taskModel.updatePositionAfterMove(existing.list_id, taskId, oldPosition, newPosition);
            await pool.query('COMMIT');
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    },

    moveTask: async (taskId: number, targetListId: number, newPosition: number, userId: number) : Promise<TaskRow> => {
        //lay task hien tai
        const existing = await taskModel.findByTaskId(taskId);
        if (!existing) throw { status: 404, message: 'Task not found.'};

        await taskService.checkMemberByListId(existing.list_id, userId);

        const currentBoardId = await listModel.findBoardIdByListId(existing.list_id);
        const targetBoardId = await listModel.findBoardIdByListId(targetListId);
        if (!targetBoardId) throw { status: 404, message: 'Target list not found.'};
        if (currentBoardId !== targetBoardId) throw { status: 400, message: 'Cannot move a task to a different board.'};

        //validate newPosition trong target list
        const maxPosition = await taskModel.findMaxPosition(targetListId);
        if (newPosition < 0 || newPosition > maxPosition + 1){
            throw { status: 400, message: 'Position out of range.'};
        };

        try{
            await pool.query('BEGIN');

            //shift cac task o list cu len (position - 1)
            await taskModel.updatePositionAfterDelete(existing.list_id, existing.position);
            //tao cho trong cho task trong target list
            await taskModel.emptyTargetPosition(targetListId, newPosition);
            //di chuyen task sang target list
            const movedTask = await taskModel.moveToList(taskId, targetListId, newPosition);

            await pool.query('COMMIT');
            return movedTask;
        } catch (error){
            await pool.query('ROLLBACK');
            throw error;
        }
    }
};

export default taskService;