import taskModel, { TaskRow } from "../models/taskModel";
import boardMemberModel from "../models/boardMemberModel";
import taskMemberModel, { TaskMemberRow } from "../models/taskMemberModel";

const taskMemberService = {
    checkMemberByListId: async (listId: number, userId: number) : Promise<void> => {
        const isMember = await boardMemberModel.memberCheckByListId(listId, userId);
        if (!isMember){
            throw { status: 403, message: 'Access denied. You are not a member of this board'}
        }
    },

    getTaskMembers: async (taskId: number, userId: number) : Promise<TaskMemberRow[]> => {
        const task = await taskModel.findByTaskId(taskId);
        if (!task) throw { status: 404, message: `Task not found.`};
        
        await taskMemberService.checkMemberByListId(task.list_id, userId);
        return taskMemberModel.findByTask(taskId);
    },
    
    addTaskMember: async (taskId: number, targetUserId: number, userId: number) : Promise<void> => {
        const task = await taskModel.findByTaskId(taskId);
        if (!task) throw { status: 404, message: 'Task not found.'};
        
        await taskMemberService.checkMemberByListId(task.list_id, userId);

        const isTargetBoardMember = await boardMemberModel.memberCheckByListId(task.list_id, targetUserId);
        if (!isTargetBoardMember){
            throw { status: 400, message: 'Target user is not a member of this board.'};
        }
        
        await taskMemberModel.add(taskId, targetUserId);
    },

    removeTaskMember: async (taskId: number, targetUserId: number, userId: number) : Promise<void> => {
        const task = await taskModel.findByTaskId(taskId);
        if (!task) throw { status: 404, message: 'Task not found.'};
        
        await taskMemberService.checkMemberByListId(task.list_id, userId);
        const deleted = await taskMemberModel.remove(taskId, targetUserId);
        if (!deleted) throw { status: 404, message: 'Member not found in this task.'};
    },
};

export default taskMemberService;