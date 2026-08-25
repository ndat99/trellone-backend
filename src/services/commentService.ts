import commentModel, { CommentRow } from "../models/commentModel";
import boardMemberModel from "../models/boardMemberModel";
import taskModel from "../models/taskModel";

const commentService = {
    checkAccessByTaskId: async (taskId: number, userId: number) => {
        const task = await taskModel.findByTaskId(taskId);
        if (!task) throw { status: 404, message: 'Task not found.'};

        const isMember = await boardMemberModel.memberCheckByListId(task.list_id, userId);
        if (!isMember) {
            throw { status: 403, message: 'Access denied. You are not a member of this board' }
        };
    },

    findCommentAndCheckOwner: async (commentId: number, userId: number) => {
        const comment = await commentModel.findById(commentId);
        if (!comment) {
            throw { status: 404, message: 'Comment not found.' };
        }
        if (comment.user_id !== userId) {
            throw { status: 403, message: 'Access denied. You are not the owner of this comment.' };
        }
    },

    getComment: async (taskId: number, userId: number) : Promise<CommentRow[]> => {
        await commentService.checkAccessByTaskId(taskId, userId);
        return commentModel.findByTask(taskId);
    },

    addComment: async (taskId: number, content: string, userId: number) : Promise<CommentRow> => {
        await commentService.checkAccessByTaskId(taskId, userId);
        
        const newComment = await commentModel.add(taskId, userId, content)
        return newComment;
    },

    editComment: async (commentId: number, taskId: number, content: string, userId: number): Promise<CommentRow> => {
        await commentService.checkAccessByTaskId(taskId, userId);
        await commentService.findCommentAndCheckOwner(commentId, userId);

        const updated = await commentModel.edit(commentId, taskId, content);
        return updated!;
    },

    deleteComment: async (commentId: number, taskId: number, userId: number) : Promise<CommentRow> => {
        await commentService.checkAccessByTaskId(taskId, userId);
        await commentService.findCommentAndCheckOwner(commentId, userId);
            
        const deletedComment = await commentModel.delete(commentId, taskId);
        return deletedComment!;
    },
};

export default commentService;