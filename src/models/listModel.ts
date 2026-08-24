import pool from '../config/db';

export interface ListRow {
    id: number,
    board_id: number,
    name: string,
    position: number,
    created_at: Date,
    updated_at: Date
}

const listModel = {
    findByBoard: async (boardId: number): Promise<ListRow[]> => {
        const query = `
            SELECT id, name, position, created_at, updated_at
            FROM lists
            WHERE board_id = $1
            ORDER BY position ASC;
        `;
        const result = await pool.query(query, [boardId]);
        return result.rows;
    },

    findBoardIdByListId: async (listId: number) : Promise<number | null> => {
        const result = await pool.query(
            `SELECT board_id FROM lists WHERE id = $1`, [listId]
        );
        return result.rows[0]?.board_id ?? null
    },

    findNextPosition: async (boardId: number) : Promise<number> => {
        const query = `
            SELECT COALESCE(MAX(position), -1) +1 AS next_position
            FROM lists
            WHERE board_id = $1;
        `;
        const positionResult = await pool.query(query, [boardId]);
        const nextPosition = positionResult.rows[0].next_position;

        return nextPosition;
    },

    create: async (boardId: number, name: string, nextPosition: number) : Promise<ListRow> => {
        const query = `
            INSERT INTO lists (board_id, name, position, created_at, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        const result = await pool.query(query, [boardId, name, nextPosition]);
        const newList = result.rows[0];

        return newList;
    },

    rename: async (name: string, listId: number, boardId: number) : Promise<ListRow | null> => {
        const query = `
            UPDATE lists
            SET name = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND board_id = $3
            RETURNING id, name, position;
        `;
        const result = await pool.query(query, [name, listId, boardId]);
        return result.rows[0] ?? null;
    },

    delete: async (listId: number, boardId: number) : Promise<ListRow | null> =>{
        const deleteResult = await pool.query(
            `DELETE FROM lists WHERE id = $1 AND board_id = $2
            RETURNING id, name, position`, [listId, boardId]
        );
        return deleteResult.rows[0] ?? null;
    },

    updatePositionAfterDelete: async (boardId: number, deletedPosition: number) : Promise<void> => {
        await pool.query(
            `UPDATE lists
            SET position = position - 1
            WHERE board_id = $1
            AND position > $2`, [boardId, deletedPosition]
        );
    },

    findMaxPosition: async (boardId: number) : Promise<number> => {
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM lists WHERE board_id = $1`, [boardId]
        );
        const maxPosition = parseInt(countResult.rows[0].count) - 1;
        return maxPosition;
    },

    findCurrentPosition: async (listId: number, boardId: number) : Promise<number | null> => {
        const result = await pool.query(
            `SELECT position FROM lists
            WHERE id = $1 AND board_id = $2`, [listId, boardId]
        );
        if (result.rows.length === 0){
            return null;
        }
        const currentPosition = result.rows[0].position;
        return currentPosition;
    },

    updatePositionAfterMove: async (boardId: number, listId: number, oldPosition: number, newPosition: number) : Promise<void> => {
        //neu di chuyen len tren (sang trai) -> cac list [newPos, oldPos) + 1
        if (newPosition < oldPosition){
            await pool.query(
                `UPDATE lists SET position = position + 1
                WHERE board_id = $1
                    AND position >= $2
                    AND position < $3`, [boardId, newPosition, oldPosition]
            );
        } else {    //neu di chuyen xuong duoi (sang phai) -> cac list (oldPos, newPos] - 1
            await pool.query(
                `UPDATE lists SET position = position - 1
                WHERE board_id = $1
                    AND position > $2
                    AND position <= $3`, [boardId, oldPosition, newPosition]
            );
        }

        //update position cua list can di chuyen
        await pool.query(`
            UPDATE lists SET position = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND board_id = $3`, [newPosition, listId, boardId]
        );
    }
};

export default listModel;