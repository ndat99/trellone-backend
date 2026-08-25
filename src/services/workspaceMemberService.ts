import userModel from "../models/userModel";
import workspaceMemberModel, { WorkspaceMemberRow, WorkspaceMemberWithUser } from "../models/workspaceMemberModel";

const workspaceMemberService = {
    checkRole: async (workspaceId: number, userId: number, requiredRoles: string[]) : Promise<void> => {
        const role = await workspaceMemberModel.getMemberRole(workspaceId, userId);
        if (!role || !requiredRoles.includes(role)){
            throw { status: 403, message: 'Access denied. Insufficient permission.'};
        }
    },

    getWorkspaceMembers: async (workspaceId: number, userId: number) : Promise<WorkspaceMemberWithUser[]> => {
        await workspaceMemberService.checkRole(workspaceId, userId, ['owner', 'admin']);
        return workspaceMemberModel.findByWorkspace(workspaceId);
    },
    
    inviteWorkspaceMember: async (workspaceId: number, targetUsername: string, requesterUserId: number) : Promise<WorkspaceMemberRow> => {
        await workspaceMemberService.checkRole(workspaceId, requesterUserId, ['owner']);

        //tim theo username
        const targetUser = await userModel.getByUsername(targetUsername);
        if (!targetUser) throw { status: 404, message: 'User not found.'};
        
        const member = await workspaceMemberModel.add(workspaceId, targetUser.id);
        if (!member) throw { status: 409, message: 'User is already a member.'};
        return member;
    },

    updateMemberRole: async (workspaceId: number, targetUserId: number, newRole: string, requesterUserId: number) : Promise<WorkspaceMemberRow> => {
        await workspaceMemberService.checkRole(workspaceId, requesterUserId, ['owner']);

        const VALID_ROLES = ['admin', 'member'];
        if (!VALID_ROLES.includes(newRole)) {
            throw { status: 400, message: 'Invalid role. Must be admin or member.'};
        }
        
        const updated = await workspaceMemberModel.updateRole(workspaceId, targetUserId, newRole);
        if (!updated) throw { status: 404, message: 'Member not found.'};
        return updated;
    },

    removeWorkspaceMember: async (workspaceId: number, targetUserId: number, requesterUserId: number) : Promise<void> => {
        await workspaceMemberService.checkRole(workspaceId, requesterUserId, ['owner']);
        
        const deleted = await workspaceMemberModel.remove(workspaceId, targetUserId);
        if (!deleted) throw { status: 404, message: 'Member not found or cannot remove owner.' };
    },
};

export default workspaceMemberService;