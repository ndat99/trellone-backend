import taskModel from "../models/taskModel";
import boardMemberModel from "../models/boardMemberModel";
import listModel from "../models/listModel";
import labelModel from "../models/labelModel";
import taskLabelModel, { TaskLabelRow } from "../models/taskLabelModel";

const taskLabelService = {
    checkMemberByListId: async (listId: number, userId: number) : Promise<void> => {
        const isMember = await boardMemberModel.memberCheckByListId(listId, userId);
        if (!isMember){
            throw { status: 403, message: 'Access denied. You are not a member of this board'}
        }
    },

    getTaskLabels: async (taskId: number, userId: number) : Promise<TaskLabelRow[]> => {
        const task = await taskModel.findByTaskId(taskId);
        if (!task) throw { status: 404, message: `Task not found.`};
        
        await taskLabelService.checkMemberByListId(task.list_id, userId);
        return taskLabelModel.findByTask(taskId);
    },
    
    addTaskLabel: async (taskId: number, labelId: number, userId: number) : Promise<void> => {
        const task = await taskModel.findByTaskId(taskId);
        if (!task) throw { status: 404, message: 'Task not found.'};
        
        await taskLabelService.checkMemberByListId(task.list_id, userId);

        const labelBoardId = await labelModel.findBoardIdByLabelId(labelId);
        const taskBoardId = await listModel.findBoardIdByListId(task.list_id);
        if (labelBoardId !== taskBoardId){
            throw { status: 400, message: 'This label is not a label of this board.'};
        }
        
        await taskLabelModel.add(taskId, labelId);
    },

    removeTaskLabel: async (taskId: number, labelId: number, userId: number) : Promise<void> => {
        const task = await taskModel.findByTaskId(taskId);
        if (!task) throw { status: 404, message: 'Task not found.'};
        
        await taskLabelService.checkMemberByListId(task.list_id, userId);
        const deleted = await taskLabelModel.remove(taskId, labelId);
        if (!deleted) throw { status: 404, message: 'Label not found in this task.'};
    }
};

export default taskLabelService;