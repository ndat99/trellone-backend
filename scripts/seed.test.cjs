'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const bcrypt = require('bcrypt');
const { DEFAULT_PASSWORD, parseOptions, buildDataset, validateDataset, summary } = require('./seed.cjs');
const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 4);
const fixture = (size = 'small') => buildDataset({ namespace: 'seed', size, date: '2026-10-29', passwordHash });

test('all three sizes produce a valid relational dataset', () => {
    for (const size of ['small', 'medium', 'large']) assert.doesNotThrow(() => validateDataset(fixture(size)));
});

test('default medium dataset provides substantial volume and all task scenarios', () => {
    const report = summary(fixture('medium'));
    assert.equal(report.rows.users, 30);
    assert.equal(report.rows.workspaces, 7);
    assert.equal(report.rows.boards, 25);
    assert.equal(report.rows.tasks, 1800);
    assert.equal(report.totalRows, 26832);
    for (const count of Object.values(report.taskScenarios)) assert.ok(count > 100);
});

test('primary accounts cover owner, admin, member, board guest, and outsider', () => {
    const { data } = fixture();
    const boardRoles = new Map(data.board_members.filter(row => row.board_id === 'w0b0').map(row => [row.user_id, row.role]));
    assert.equal(boardRoles.get('u0'), 'owner');
    assert.equal(boardRoles.get('u1'), 'admin');
    assert.equal(boardRoles.get('u2'), 'member');
    assert.equal(boardRoles.get('u3'), 'member');
    assert.ok(!data.workspace_members.some(row => row.user_id === 'u3'));
    assert.ok(!data.workspace_members.some(row => row.user_id === 'u4'));
    assert.ok(!data.board_members.some(row => row.user_id === 'u4'));
});

test('empty workspace, board, and list have no children', () => {
    const { data } = fixture();
    assert.ok(!data.boards.some(row => row.workspace_id === 'empty-workspace'));
    assert.ok(!data.lists.some(row => row.board_id === 'empty-board'));
    assert.ok(!data.tasks.some(row => row.list_id === 'empty-list'));
});

test('seed accounts can log in with the documented demo password', async () => {
    const { data } = fixture();
    assert.ok(await bcrypt.compare(DEFAULT_PASSWORD, data.users[0].password_hash));
    assert.ok(!(await bcrypt.compare('wrong-password', data.users[0].password_hash)));
});

test('data is reproducible for the same date, namespace, size, and hash', () => {
    assert.deepEqual(fixture(), fixture());
});

test('cross-board labels are rejected before reaching the database', () => {
    const dataset = fixture();
    dataset.data.task_labels[0].label_id = 'w0b1label0';
    assert.throws(() => validateDataset(dataset), /Cross-board label/);
});

test('assigning an outsider is rejected before reaching the database', () => {
    const dataset = fixture();
    dataset.data.task_members[0].user_id = 'u4';
    assert.throws(() => validateDataset(dataset), /Assignee is outside board/);
});

test('orphan references and duplicate positions are rejected', () => {
    const orphan = fixture();
    orphan.data.comments[0].task_id = 'missing-task';
    assert.throws(() => validateDataset(orphan), /Invalid FK/);
    const positions = fixture();
    positions.data.tasks[0].position = 1;
    assert.throws(() => validateDataset(positions), /Non-contiguous positions/);
});

test('invalid activity targets are rejected', () => {
    const dataset = fixture();
    dataset.data.activities[0].entity_id = 'missing-workspace';
    assert.throws(() => validateDataset(dataset), /Invalid activity entity/);
});

test('CLI rejects invalid namespace, size, date, and unknown arguments', () => {
    for (const args of [
        ['--namespace', 'bad-name'], ['--namespace', 'x;drop'], ['--size', 'huge'],
        ['--date', '2026-02-30'], ['--date', 'not-a-date'], ['--reset'], ['--size']
    ]) assert.throws(() => parseOptions(args));
    assert.equal(parseOptions(['--namespace=demo2', '--size=large']).namespace, 'demo2');
});

test('dry-run succeeds without a database connection or exposing DB credentials', () => {
    const run = spawnSync(process.execPath, [path.join(__dirname, 'seed.cjs'), '--dry-run', '--size', 'small', '--date', '2026-10-29'], {
        encoding: 'utf8', timeout: 15000,
        env: { ...process.env, DB_HOST: '127.0.0.1', DB_PORT: '1', DB_PASSWORD: 'do-not-print-this-value' }
    });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(JSON.parse(run.stdout).databaseConnection, 'not opened');
    assert.ok(!run.stdout.includes('do-not-print-this-value'));
});
