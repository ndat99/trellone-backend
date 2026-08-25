import userModel from "../models/userModel";
import boardMemberModel, { BoardMemberRow, BoardMemberWithUser } from "../models/boardMemberModel";

const boardMemberService = {
    checkRole: async (boardId: number, userId: number, requiredRoles: string[]) : Promise<void> => {
        const role = await boardMemberModel.getMemberRole(boardId, userId);
        if (!role || !requiredRoles.includes(role)){
            throw { status: 403, message: 'Access denied. Insufficient permission.'};
        }
    },

    getBoardMembers: async (boardId: number, userId: number) : Promise<BoardMemberWithUser[]> => {
        await boardMemberService.checkRole(boardId, userId, ['owner', 'admin']);
        return boardMemberModel.findByBoard(boardId);
    },
    
    inviteBoardMember: async (boardId: number, targetUsername: string, requesterUserId: number) : Promise<BoardMemberRow> => {
        await boardMemberService.checkRole(boardId, requesterUserId, ['owner']);

        //tim theo username
        const targetUser = await userModel.getByUsername(targetUsername);
        if (!targetUser) throw { status: 404, message: 'User not found.'};
        
        const member = await boardMemberModel.add(boardId, targetUser.id);
        if (!member) throw { status: 409, message: 'User is already a member.'};
        return member;
    },

    updateMemberRole: async (boardId: number, targetUserId: number, newRole: string, requesterUserId: number) : Promise<BoardMemberRow> => {
        await boardMemberService.checkRole(boardId, requesterUserId, ['owner']);

        const VALID_ROLES = ['admin', 'member'];
        if (!VALID_ROLES.includes(newRole)) {
            throw { status: 400, message: 'Invalid role. Must be admin or member.'};
        }
        
        const updated = await boardMemberModel.updateRole(boardId, targetUserId, newRole);
        if (!updated) throw { status: 404, message: 'Member not found.'};
        return updated;
    },

    removeBoardMember: async (boardId: number, targetUserId: number, requesterUserId: number) : Promise<void> => {
        await boardMemberService.checkRole(boardId, requesterUserId, ['owner']);
        
        const deleted = await boardMemberModel.remove(boardId, targetUserId);
        if (!deleted) throw { status: 404, message: 'Member not found or cannot remove owner.' };
    },
};

export default boardMemberService;