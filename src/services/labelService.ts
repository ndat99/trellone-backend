import pool from "../config/db";
import labelModel, { LabelRow } from "../models/labelModel";
import boardMemberModel from "../models/boardMemberModel";

const labelService = {
    checkMember: async (boardId: number, userId: number) : Promise<void> => {
        const isMember = await boardMemberModel.memberCheck(boardId, userId);
        if (!isMember){
            throw { status: 403, message: 'Access denied. You are not a member of this board'}
        }
    },
    
    getLabel: async (boardId: number, userId: number) : Promise<LabelRow[]> => {
        await labelService.checkMember(boardId, userId);

        return labelModel.findByBoard(boardId);
    },

    createLabel: async (boardId: number, name: string, userId: number, color: string) : Promise<LabelRow> => {
        await labelService.checkMember(boardId, userId);
        
        const newLabel = await labelModel.create(boardId, name, color);
        return newLabel;
    },

    updateLabelName: async (boardId: number, name: string, labelId: number, userId: number): Promise<LabelRow> => {
        await labelService.checkMember(boardId, userId);

        const label = await labelModel.rename(name, labelId, boardId);
        if (!label){
            throw { status: 404, message: 'Label not found or access denied.'}
        }
        return label;
    },

    deleteLabel: async (boardId: number, userId: number, labelId: number) : Promise<LabelRow> => {
        await labelService.checkMember(boardId, userId);
        
        const deletedLabel = await labelModel.delete(labelId, boardId);
        if (!deletedLabel) {
            throw { status: 404, message: 'Label not found.'}
        }
        return deletedLabel;
    },
};

export default labelService;