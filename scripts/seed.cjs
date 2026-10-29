#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const DEFAULT_PASSWORD = 'TrelloneDemo@123';
const SIZES = {
    small: { users: 12, workspaces: 2, boards: 2, tasks: 8 },
    medium: { users: 30, workspaces: 6, boards: 4, tasks: 15 },
    large: { users: 60, workspaces: 10, boards: 6, tasks: 30 }
};
const DAY = 86400000;
const HOUR = 3600000;
const BATCH_SIZE = 500;
const PROJECTS = [
    'Sản phẩm Trellone', 'Website thương mại điện tử', 'Ứng dụng sinh viên',
    'Chiến dịch marketing', 'Nền tảng học trực tuyến', 'Vận hành nội bộ',
    'Ứng dụng đặt lịch', 'Cổng thông tin khách hàng', 'Phân tích dữ liệu', 'Hệ thống nhân sự'
];
const BOARDS = ['Product roadmap', 'Sprint planning', 'Bugs & improvements', 'Release checklist', 'Research', 'Operations'];
const LISTS = ['Backlog', 'To do', 'In progress', 'Review', 'Done'];
const TASKS = [
    'Thiết kế giao diện đăng nhập', 'Xây dựng trang đăng ký', 'Kiểm tra phân quyền workspace',
    'Hoàn thiện giao diện board', 'Thêm thao tác kéo thả task', 'Viết tài liệu API',
    'Kiểm tra luồng khôi phục task', 'Tối ưu truy vấn PostgreSQL', 'Bổ sung kiểm tra dữ liệu',
    'Thiết kế cửa sổ chi tiết task', 'Kiểm tra chức năng comment', 'Hoàn thiện quản lý thành viên',
    'Thêm bộ lọc theo nhãn', 'Xử lý trạng thái đang tải', 'Kiểm tra giao diện điện thoại',
    'Cập nhật thông tin tài khoản', 'Chuẩn bị dữ liệu demo', 'Kiểm tra ngày hết hạn',
    'Thiết lập kiểm thử tự động', 'Rà soát trải nghiệm người dùng', 'Thiết kế thông báo lỗi',
    'Tối ưu dung lượng ảnh', 'Kiểm tra trường hợp không có dữ liệu', 'Hoàn thiện phân trang',
    'Cập nhật hướng dẫn triển khai', 'Kiểm tra khả năng truy cập', 'Rà soát màu sắc giao diện',
    'Đánh giá hiệu năng backend', 'Chuẩn bị kịch bản thuyết trình', 'Tổng hợp phản hồi người dùng'
];
const PEOPLE = [
    'Nguyễn Minh Anh', 'Trần Hoàng Nam', 'Lê Thu Hà', 'Phạm Gia Huy', 'Đặng Ngọc Mai',
    'Võ Đức Long', 'Bùi Khánh Linh', 'Đỗ Quang Minh', 'Hồ Phương Thảo', 'Ngô Hải Đăng'
];
const LABELS = [
    ['Ưu tiên cao', '#ef4444'], ['Bug', '#f97316'], ['Frontend', '#3b82f6'],
    ['Backend', '#8b5cf6'], ['Thiết kế', '#ec4899'], ['Tài liệu', '#22c55e']
];

// Logical keys are mapped to fresh database-generated IDs. Existing IDs are never reused.
const TABLES = [
    { name: 'users', columns: ['username', 'password_hash', 'name', 'email', 'avatar_url', 'created_at'], identity: ['username'] },
    { name: 'workspaces', columns: ['name', 'owner_id', 'created_at', 'updated_at'], identity: ['name', 'owner_id'], fk: { owner_id: 'users' } },
    { name: 'workspace_members', columns: ['workspace_id', 'user_id', 'role'], fk: { workspace_id: 'workspaces', user_id: 'users' } },
    { name: 'boards', columns: ['name', 'workspace_id', 'created_at', 'updated_at', 'bg_color', 'bg_image_url'], identity: ['name', 'workspace_id'], fk: { workspace_id: 'workspaces' } },
    { name: 'board_members', columns: ['board_id', 'user_id', 'role', 'joined_at'], fk: { board_id: 'boards', user_id: 'users' } },
    { name: 'lists', columns: ['board_id', 'name', 'position', 'created_at', 'updated_at'], identity: ['name', 'board_id'], fk: { board_id: 'boards' } },
    { name: 'labels', columns: ['board_id', 'name', 'color'], identity: ['name', 'board_id'], fk: { board_id: 'boards' } },
    { name: 'tasks', columns: ['name', 'description', 'position', 'created_by', 'is_done', 'is_archived', 'list_id', 'start_date', 'due_date', 'created_at', 'updated_at', 'cover_color'], identity: ['name', 'list_id'], fk: { created_by: 'users', list_id: 'lists' } },
    { name: 'task_members', columns: ['task_id', 'user_id'], fk: { task_id: 'tasks', user_id: 'users' } },
    { name: 'task_labels', columns: ['task_id', 'label_id'], fk: { task_id: 'tasks', label_id: 'labels' } },
    { name: 'checklist_items', columns: ['content', 'task_id', 'is_done', 'position'], fk: { task_id: 'tasks' } },
    { name: 'comments', columns: ['content', 'task_id', 'user_id', 'created_at', 'updated_at'], fk: { task_id: 'tasks', user_id: 'users' } },
    { name: 'attachments', columns: ['task_id', 'file_name', 'file_size', 'file_url', 'uploaded_by', 'created_at'], fk: { task_id: 'tasks', uploaded_by: 'users' } },
    { name: 'activities', columns: ['user_id', 'action', 'entity_type', 'entity_id', 'created_at'], fk: { user_id: 'users' } }
];
const ENTITY_TABLE = { WORKSPACE: 'workspaces', BOARD: 'boards', LIST: 'lists', TASK: 'tasks' };

function today() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
}

function parseOptions(args) {
    const options = { namespace: 'seed', size: 'medium', date: today(), dryRun: false, help: false };
    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === '--dry-run') options.dryRun = true;
        else if (argument === '--help' || argument === '-h') options.help = true;
        else {
            const match = /^--(namespace|size|date)(?:=(.*))?$/.exec(argument);
            if (!match) throw new Error('Unknown argument: ' + argument);
            const value = match[2] ?? args[++index];
            if (!value || value.startsWith('--')) throw new Error('Missing value for --' + match[1]);
            options[match[1]] = value;
        }
    }
    assert.match(options.namespace, /^[a-z][a-z0-9_]{0,15}$/, 'Namespace must be 1–16 lowercase letters/digits/underscores, starting with a letter.');
    assert.ok(Object.hasOwn(SIZES, options.size), 'Size must be small, medium, or large.');
    assert.match(options.date, /^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.');
    const date = new Date(options.date + 'T00:00:00Z');
    assert.ok(Number.isFinite(date.getTime()) && date.toISOString().startsWith(options.date), 'Invalid date.');
    return options;
}

function buildDataset(options) {
    const config = SIZES[options.size];
    assert.ok(config, 'Unknown seed size.');
    const anchor = new Date(options.date + 'T12:00:00+07:00').getTime();
    // The dump uses timestamp WITHOUT time zone. Store readable Vietnam-local timestamps.
    const stamp = (days = 0, hours = 0) => new Date(anchor + days * DAY + hours * HOUR + 7 * HOUR)
        .toISOString().slice(0, 19).replace('T', ' ');
    const data = Object.fromEntries(TABLES.map(table => [table.name, []]));
    const add = (table, row) => { data[table].push(row); return row; };
    const prefix = '[' + options.namespace + '] ';
    const core = ['owner', 'admin', 'member', 'guest', 'outsider'];
    const users = Array.from({ length: config.users }, (_, index) => {
        const suffix = core[index] || 'user' + String(index - 4).padStart(2, '0');
        const username = options.namespace + '_' + suffix;
        return add('users', {
            key: 'u' + index, username, email: username + '@seed.trellone.test',
            password_hash: options.passwordHash,
            name: index < 5 ? 'Demo ' + suffix : PEOPLE[(index - 5) % PEOPLE.length] + ' ' + (index - 4),
            avatar_url: null, created_at: stamp(-150, index % 10)
        });
    });
    const staff = users.slice(5);
    const owner = users[0].key;
    const admin = users[1].key;
    const member = users[2].key;
    const guest = users[3].key;
    const activity = (user_id, action, entity_type, entity_id, created_at) => add('activities', {
        key: 'a' + data.activities.length, user_id, action, entity_type, entity_id, created_at
    });

    for (let w = 0; w < config.workspaces; w++) {
        const workspace = add('workspaces', {
            key: 'w' + w, name: prefix + PROJECTS[w], owner_id: owner,
            created_at: stamp(-100 + w), updated_at: stamp(-1)
        });
        const colleagues = Array.from({ length: Math.min(8, staff.length) }, (_, i) => staff[(w * 3 + i) % staff.length].key);
        const workspaceUsers = [owner, admin, member, ...colleagues];
        for (const user_id of workspaceUsers) add('workspace_members', {
            key: workspace.key + '-' + user_id, workspace_id: workspace.key, user_id,
            role: user_id === owner ? 'owner' : user_id === admin ? 'admin' : 'member'
        });
        activity(owner, 'CREATE', 'WORKSPACE', workspace.key, workspace.created_at);

        for (let b = 0; b < config.boards; b++) {
            const board = add('boards', {
                key: workspace.key + 'b' + b, workspace_id: workspace.key,
                name: prefix + BOARDS[b], created_at: stamp(-95 + w, b), updated_at: stamp(-1, b),
                bg_color: LABELS[(w + b) % LABELS.length][1], bg_image_url: null
            });
            // Core roles are stable on the first board. Some other boards are owned by the admin.
            const boardOwner = b % 2 === 0 ? owner : admin;
            const boardUsers = [...workspaceUsers];
            if (w === 0 && b === 0) boardUsers.push(guest);
            for (const user_id of boardUsers) add('board_members', {
                key: board.key + '-' + user_id, board_id: board.key, user_id,
                role: user_id === boardOwner ? 'owner' : [owner, admin].includes(user_id) ? 'admin' : 'member',
                joined_at: board.created_at
            });
            activity(boardOwner, 'CREATE', 'BOARD', board.key, board.created_at);
            const labels = LABELS.map(([name, color], index) => add('labels', {
                key: board.key + 'label' + index, board_id: board.key, name, color
            }));

            for (let l = 0; l < LISTS.length; l++) {
                const list = add('lists', {
                    key: board.key + 'l' + l, board_id: board.key, name: LISTS[l], position: l,
                    created_at: stamp(-90 + w, b), updated_at: stamp(-1, b)
                });
                activity(boardOwner, 'CREATE', 'LIST', list.key, list.created_at);
                for (let t = 0; t < config.tasks; t++) {
                    const index = data.tasks.length;
                    const author = boardUsers[index % boardUsers.length];
                    const task = add('tasks', {
                        key: list.key + 't' + t, list_id: list.key,
                        name: TASKS[(t + l * 3 + b) % TASKS.length] + ' · ' + String(t + 1).padStart(2, '0'),
                        description: index % 7 === 0 ? null : [
                            'Mục tiêu: hoàn thành hạng mục trong board ' + board.name + '.',
                            'Yêu cầu: kiểm tra dữ liệu đầu vào, quyền truy cập và trường hợp không có dữ liệu.',
                            'Tiêu chí nghiệm thu: chức năng hoạt động trên máy tính và điện thoại; không có lỗi console.'
                        ].join('\n\n'),
                        position: t, created_by: author,
                        is_done: l === 4 || index % 9 === 0,
                        is_archived: index % 11 === 0,
                        start_date: index % 5 === 0 ? null : stamp(-69 + w + t % 8),
                        due_date: index % 4 === 0 ? null : stamp((index % 23) - 9, 5),
                        created_at: stamp(-70 + w + t % 8, b),
                        updated_at: stamp(-1 - index % 12, b),
                        cover_color: index % 3 === 0 ? LABELS[index % LABELS.length][1] : null
                    });
                    const assigned = [author, boardUsers[(index + 1) % boardUsers.length]];
                    for (const user_id of assigned) add('task_members', {
                        key: task.key + '-' + user_id, task_id: task.key, user_id
                    });
                    for (const labelIndex of [index % 6, (index + 2) % 6]) add('task_labels', {
                        key: task.key + '-' + labelIndex, task_id: task.key, label_id: labels[labelIndex].key
                    });
                    for (let c = 0; c < 4; c++) add('checklist_items', {
                        key: task.key + 'check' + c, task_id: task.key, position: c,
                        content: ['Phân tích yêu cầu', 'Triển khai chức năng', 'Kiểm tra các trường hợp lỗi', 'Cập nhật tài liệu'][c],
                        is_done: task.is_done || c < index % 4
                    });
                    activity(author, 'CREATE', 'TASK', task.key, task.created_at);
                    for (let c = 0; c < 2; c++) {
                        const user_id = boardUsers[(index + c + 1) % boardUsers.length];
                        const created_at = stamp(-55 + w + t % 8, b + c);
                        add('comments', {
                            key: task.key + 'comment' + c, task_id: task.key, user_id,
                            content: c === 0
                                ? 'Mình đã xem yêu cầu. Sẽ kiểm tra thêm trường hợp dữ liệu trống trước khi hoàn tất.'
                                : 'Đã cập nhật checklist. Nhờ mọi người review giúp phần giao diện và thông báo lỗi.',
                            created_at, updated_at: created_at
                        });
                        activity(user_id, 'COMMENT', 'TASK', task.key, created_at);
                    }
                    if (task.is_done || task.is_archived) activity(author, 'UPDATE', 'TASK', task.key, task.updated_at);
                    if (index % 10 === 0) add('attachments', {
                        key: task.key + 'attachment', task_id: task.key, uploaded_by: author,
                        file_name: 'acceptance-notes.txt', file_size: 2048,
                        // Metadata only: no real upload/download is claimed by this fixture.
                        file_url: 'https://example.invalid/trellone-seed/' + options.namespace + '/' + task.key + '/acceptance-notes.txt',
                        created_at: stamp(-50 + w)
                    });
                }
            }
        }
    }

    add('lists', {
        key: 'empty-list', board_id: 'w0b0', name: 'Empty list', position: LISTS.length,
        created_at: stamp(-20), updated_at: stamp(-20)
    });
    add('boards', {
        key: 'empty-board', workspace_id: 'w0', name: prefix + 'Empty board',
        created_at: stamp(-20), updated_at: stamp(-20), bg_color: '#64748b', bg_image_url: null
    });
    for (const [user_id, role] of [[owner, 'owner'], [admin, 'admin'], [member, 'member']]) add('board_members', {
        key: 'empty-board-' + user_id, board_id: 'empty-board', user_id, role, joined_at: stamp(-20)
    });
    add('workspaces', {
        key: 'empty-workspace', name: prefix + 'Empty workspace', owner_id: owner,
        created_at: stamp(-10), updated_at: stamp(-10)
    });
    for (const [user_id, role] of [[owner, 'owner'], [admin, 'admin'], [member, 'member']]) add('workspace_members', {
        key: 'empty-workspace-' + user_id, workspace_id: 'empty-workspace', user_id, role
    });
    return { options: { namespace: options.namespace, size: options.size, date: options.date }, data };
}

function validateDataset(dataset) {
    const { data } = dataset;
    const maps = Object.fromEntries(TABLES.map(table => [table.name, new Map(data[table.name].map(row => [row.key, row]))]));
    for (const table of TABLES) {
        assert.equal(maps[table.name].size, data[table.name].length, 'Duplicate logical key in ' + table.name);
        for (const row of data[table.name]) {
            for (const column of table.columns) assert.ok(Object.hasOwn(row, column), table.name + '.' + column + ' missing');
            for (const [column, target] of Object.entries(table.fk || {})) {
                if (row[column] !== null) assert.ok(maps[target].has(row[column]), 'Invalid FK ' + table.name + '.' + column);
            }
            if (row.created_at && row.updated_at) assert.ok(row.created_at <= row.updated_at, 'Invalid timestamp order');
            if (row.start_date && row.due_date) assert.ok(row.start_date <= row.due_date, 'Invalid task date range');
        }
    }
    for (const table of ['workspace_members', 'board_members']) {
        for (const row of data[table]) assert.ok(['owner', 'admin', 'member'].includes(row.role), 'Invalid member role');
    }
    const boardUsers = new Map(data.board_members.map(row => [row.board_id + ':' + row.user_id, row.role]));
    const taskBoard = key => maps.lists.get(maps.tasks.get(key).list_id).board_id;
    for (const workspace of data.workspaces) {
        const owners = data.workspace_members.filter(row => row.workspace_id === workspace.key && row.role === 'owner');
        assert.equal(owners.length, 1, 'Workspace must have one owner');
        assert.equal(owners[0].user_id, workspace.owner_id);
    }
    for (const board of data.boards) {
        assert.equal(data.board_members.filter(row => row.board_id === board.key && row.role === 'owner').length, 1, 'Board must have one owner');
    }
    for (const row of data.tasks) assert.ok(boardUsers.has(taskBoard(row.key) + ':' + row.created_by), 'Task creator is outside board');
    for (const row of data.task_members) assert.ok(boardUsers.has(taskBoard(row.task_id) + ':' + row.user_id), 'Assignee is outside board');
    for (const row of data.task_labels) assert.equal(taskBoard(row.task_id), maps.labels.get(row.label_id).board_id, 'Cross-board label');
    for (const row of data.comments) assert.ok(boardUsers.has(taskBoard(row.task_id) + ':' + row.user_id), 'Comment author is outside board');
    for (const row of data.attachments) assert.ok(boardUsers.has(taskBoard(row.task_id) + ':' + row.uploaded_by), 'Uploader is outside board');
    for (const row of data.activities) {
        assert.ok(ENTITY_TABLE[row.entity_type] && maps[ENTITY_TABLE[row.entity_type]].has(row.entity_id), 'Invalid activity entity');
    }
    for (const [table, parent] of [['lists', 'board_id'], ['tasks', 'list_id'], ['checklist_items', 'task_id']]) {
        const groups = new Map();
        for (const row of data[table]) {
            if (!groups.has(row[parent])) groups.set(row[parent], []);
            groups.get(row[parent]).push(row.position);
        }
        for (const positions of groups.values()) assert.deepEqual(positions.sort((a, b) => a - b), positions.map((_, index) => index), 'Non-contiguous positions in ' + table);
    }
    const unique = (rows, fields) => assert.equal(new Set(rows.map(row => fields.map(field => row[field]).join('\0'))).size, rows.length, 'Duplicate ' + fields.join('/'));
    unique(data.users, ['username']); unique(data.users, ['email']);
    unique(data.workspace_members, ['workspace_id', 'user_id']);
    unique(data.board_members, ['board_id', 'user_id']);
    unique(data.task_members, ['task_id', 'user_id']); unique(data.task_labels, ['task_id', 'label_id']);
    for (const row of data.users) assert.match(row.password_hash, /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/, 'Invalid bcrypt hash');
    const lengths = { users: { username: 50, name: 100, email: 255 }, workspaces: { name: 100 }, boards: { name: 100, bg_color: 10 }, lists: { name: 50 }, tasks: { name: 100, cover_color: 10 }, labels: { name: 50, color: 10 }, attachments: { file_name: 250 } };
    for (const [table, columns] of Object.entries(lengths)) {
        for (const row of data[table]) for (const [column, max] of Object.entries(columns)) {
            assert.ok(row[column] === null || [...row[column]].length <= max, 'Value exceeds column length: ' + table + '.' + column);
        }
    }
    return dataset;
}

function summary(dataset) {
    const counts = Object.fromEntries(TABLES.map(table => [table.name, dataset.data[table.name].length]));
    const now = dataset.options.date + ' 12:00:00';
    return {
        namespace: dataset.options.namespace, size: dataset.options.size, date: dataset.options.date,
        rows: counts, totalRows: Object.values(counts).reduce((total, count) => total + count, 0),
        taskScenarios: {
            archived: dataset.data.tasks.filter(row => row.is_archived).length,
            done: dataset.data.tasks.filter(row => row.is_done).length,
            overdue: dataset.data.tasks.filter(row => !row.is_archived && !row.is_done && row.due_date && row.due_date < now).length,
            withoutDueDate: dataset.data.tasks.filter(row => row.due_date === null).length
        }
    };
}

function qualified(schema, table) {
    assert.match(schema, /^[a-z][a-z0-9_]*$/);
    return '"' + schema + '"."' + table + '"';
}

async function seedDatabase(client, dataset, schema = 'public') {
    validateDataset(dataset);
    // The caller owns BEGIN/COMMIT/ROLLBACK. Tests can use an isolated schema and roll back.
    await client.query('SELECT pg_advisory_xact_lock(724829, hashtext($1))', [schema + ':' + dataset.options.namespace]);
    const columns = await client.query('SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = $1', [schema]);
    const available = new Set(columns.rows.map(row => row.table_name + '.' + row.column_name));
    for (const table of TABLES) for (const column of table.columns) assert.ok(available.has(table.name + '.' + column), 'Database schema is missing ' + table.name + '.' + column);

    const expectedUsers = new Map(dataset.data.users.map(row => [row.username, row.email]));
    const existing = await client.query(
        'SELECT id, username, email FROM ' + qualified(schema, 'users') + ' WHERE username = ANY($1::text[]) OR email = ANY($2::text[])',
        [[...expectedUsers.keys()], [...expectedUsers.values()]]
    );
    if (existing.rows.length) {
        const ownUsers = existing.rows.length === expectedUsers.size && existing.rows.every(row => expectedUsers.get(row.username) === row.email);
        if (ownUsers) {
            const owner = existing.rows.find(row => row.username === dataset.options.namespace + '_owner');
            const workspaces = await client.query(
                'SELECT id, name FROM ' + qualified(schema, 'workspaces') + ' WHERE owner_id = $1 AND name = ANY($2::text[])',
                [owner.id, dataset.data.workspaces.map(row => row.name)]
            );
            if (workspaces.rows.length === dataset.data.workspaces.length && new Set(workspaces.rows.map(row => row.name)).size === dataset.data.workspaces.length) {
                return { status: 'already-seeded', insertedRows: 0, namespace: dataset.options.namespace };
            }
        }
        throw new Error('Namespace overlaps existing or incomplete data. No rows were changed. Choose a different --namespace, for example demo2.');
    }

    const ids = Object.fromEntries(TABLES.map(table => [table.name, new Map()]));
    for (const table of TABLES) {
        const rows = dataset.data[table.name];
        for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
            const batch = rows.slice(offset, offset + BATCH_SIZE);
            const values = [];
            const identities = new Map();
            const identityOf = row => JSON.stringify(table.identity.map(column => row[column]));
            const placeholders = batch.map(row => {
                const mapped = { ...row };
                for (const [column, target] of Object.entries(table.fk || {})) {
                    if (row[column] !== null) {
                        assert.ok(ids[target].has(row[column]), 'Missing inserted parent ID');
                        mapped[column] = ids[target].get(row[column]);
                    }
                }
                if (table.name === 'activities') mapped.entity_id = ids[ENTITY_TABLE[row.entity_type]].get(row.entity_id);
                if (table.identity) identities.set(identityOf(mapped), row.key);
                return '(' + table.columns.map(column => {
                    values.push(mapped[column]);
                    return '$' + values.length;
                }).join(', ') + ')';
            });
            const returning = table.identity ? ' RETURNING id, ' + table.identity.map(column => '"' + column + '"').join(', ') : '';
            const sql = 'INSERT INTO ' + qualified(schema, table.name) + ' (' + table.columns.map(column => '"' + column + '"').join(', ') + ') VALUES ' + placeholders.join(', ') + returning;
            const result = await client.query(sql, values);
            assert.equal(result.rowCount, batch.length, 'Unexpected inserted row count');
            if (table.identity) for (const row of result.rows) {
                const key = identities.get(identityOf(row));
                assert.ok(key, 'Cannot map inserted ID for ' + table.name);
                ids[table.name].set(key, row.id);
            }
        }
    }
    const firstActive = dataset.data.tasks.find(row => !row.is_archived);
    return {
        status: 'seeded', ...summary(dataset),
        examples: {
            workspaceId: ids.workspaces.get('w0'), boardId: ids.boards.get('w0b0'),
            listId: ids.lists.get('w0b0l0'), taskId: ids.tasks.get(firstActive.key)
        }
    };
}

async function main() {
    const options = parseOptions(process.argv.slice(2));
    if (options.help) {
        console.log('Usage: npm run seed -- [--dry-run] [--size small|medium|large] [--namespace seed] [--date YYYY-MM-DD]');
        console.log('Adds demo data only. Existing data is preserved. Reusing a completed namespace is a no-op.');
        return;
    }
    require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
    const password = process.env.SEED_PASSWORD || DEFAULT_PASSWORD;
    const passwordHash = await require('bcrypt').hash(password, 10);
    const dataset = validateDataset(buildDataset({ ...options, passwordHash }));
    if (options.dryRun) {
        console.log(JSON.stringify({ dryRun: true, databaseConnection: 'not opened', ...summary(dataset) }, null, 2));
        return;
    }
    assert.ok(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER, 'DB_HOST, DB_NAME, and DB_USER must be set in backend/.env.');
    const { Client } = require('pg');
    const client = new Client({
        host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: 10000, application_name: 'trellone-demo-seed'
    });
    let connected = false;
    try {
        await client.connect();
        connected = true;
        await client.query('BEGIN');
        await client.query("SET LOCAL lock_timeout = '10s'");
        await client.query("SET LOCAL statement_timeout = '120s'");
        const result = await seedDatabase(client, dataset);
        await client.query('COMMIT');
        console.log(JSON.stringify(result, null, 2));
        console.log('Demo accounts: ' + ['owner', 'admin', 'member', 'guest', 'outsider'].map(role => options.namespace + '_' + role).join(', '));
        if (result.status === 'seeded') console.log('Password: ' + (process.env.SEED_PASSWORD ? 'the value of SEED_PASSWORD' : DEFAULT_PASSWORD));
        else console.log('Existing seed data and account passwords were kept unchanged.');
    } catch (error) {
        if (connected) await client.query('ROLLBACK');
        throw error;
    } finally {
        await client.end();
    }
}

module.exports = { DEFAULT_PASSWORD, SIZES, TABLES, parseOptions, buildDataset, validateDataset, summary, seedDatabase };
if (require.main === module) main().catch(error => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
});
