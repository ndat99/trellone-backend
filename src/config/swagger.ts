// Canonical URLs follow Trellone.postman_collection.json.
// Response schemas match the current controller envelopes and SQL projections.
type Schema = Record<string, unknown>;
type Parameter = Record<string, unknown>;
type SecurityRequirement = Record<string, string[]>;

const ref = (name: string): Schema => ({ $ref: '#/components/schemas/' + name });
const arrayOf = (name: string): Schema => ({ type: 'array', items: ref(name) });
const object = (properties: Record<string, Schema>, required = Object.keys(properties)): Schema =>
    ({ type: 'object', properties, ...(required.length ? { required } : {}) });
const id: Schema = { type: 'integer', minimum: 1, example: 1 };
const name: Schema = { type: 'string', example: 'My project' };
const position: Schema = { type: 'integer', minimum: 0, example: 0 };
const date: Schema = { type: 'string', format: 'date-time', example: '2026-10-28T09:00:00.000Z' };
const nullableDate: Schema = { ...date, nullable: true };
const color: Schema = { type: 'string', maxLength: 10, nullable: true, example: '#8da87e' };
const message: Schema = { type: 'string', example: 'Operation completed successfully.' };
const accessToken: Schema = {
    type: 'string', example: '<accessToken returned by login or refresh>',
    description: 'HS256 JWT with a lifetime of at most 15 minutes and never beyond the session expiry. Protected requests also require an active session; revocation rejects the JWT before exp. Copy the actual response value into Authorize, without the Bearer prefix.'
};
const role: Schema = { type: 'string', enum: ['owner', 'admin', 'member'], example: 'member' };
const named = { id, name };
const positioned = { ...named, position };
const timestamps = { created_at: date, updated_at: date };
const user = {
    id,
    username: { type: 'string', example: 'demo_user' },
    email: { type: 'string', format: 'email', example: 'demo@example.com' },
    name: { type: 'string', example: 'Demo User' }
};
const memberUser = {
    username: user.username, name: user.name,
    avatar_url: { type: 'string', nullable: true, example: null }
};
const workspaceMember = { workspace_id: id, user_id: id, role };
const boardMember = { board_id: id, user_id: id, role };
const board = {
    ...named, workspace_id: id, ...timestamps, bg_color: color,
    bg_image_url: { type: 'string', nullable: true, example: null }
};
const taskSummary = {
    ...positioned, ...timestamps, cover_color: color,
    is_done: { type: 'boolean', example: false },
    is_archived: { type: 'boolean', example: false }
};
const taskDetails = {
    ...named,
    description: { type: 'string', nullable: true, example: 'Describe the API.' },
    is_done: { type: 'boolean', example: false },
    due_date: nullableDate, start_date: nullableDate, cover_color: color, updated_at: date
};
const checklist = {
    id, content: { type: 'string', example: 'Review the implementation' },
    is_done: { type: 'boolean', example: false }, position
};
const comment = {
    id, task_id: id, content: { type: 'string', example: 'Please review this task.' },
    user_id: { ...id, nullable: true }, ...timestamps
};
const label = {
    id, name: { type: 'string', example: 'Urgent' },
    color: { type: 'string', maxLength: 10, example: '#800080' }
};
const nameInput = (maxLength: number): Schema => object({
    name: { type: 'string', minLength: 1, maxLength }
});
const wrap = (key: string, schema: string): Schema => object({ message, [key]: ref(schema) });

const schemas: Record<string, Schema> = {
    Error: object({
        message: { type: 'string', example: 'Access denied.' },
        code: {
            type: 'string',
            enum: ['ACCESS_TOKEN_EXPIRED', 'ACCESS_TOKEN_INVALID', 'REFRESH_TOKEN_INVALID', 'SESSION_REVOKED'],
            example: 'ACCESS_TOKEN_EXPIRED',
            description: 'Optional machine-readable auth error code. ACCESS_TOKEN_EXPIRED may be resolved by refresh while the session is active. SESSION_REVOKED means the session is missing, revoked, or expired; log in again. Other errors may only include message.'
        }
    }, ['message']),
    Message: object({ message }),
    Health: object({
        status: { type: 'string', example: 'OK' },
        message: { type: 'string', example: 'Express Server is running' }
    }),
    LoginUser: object(user),
    User: object({
        ...user,
        avatar_url: { type: 'string', format: 'uri', nullable: true },
        created_at: date
    }),
    LoginResponse: object({
        message: { type: 'string', example: 'Login successful' },
        accessToken,
        user: ref('LoginUser')
    }),
    RefreshResponse: object({ accessToken }),
    LogoutResponse: object({ message: { type: 'string', example: 'Logged out successfully.' } }),
    NamedEntity: object(named),
    PositionedEntity: object(positioned),
    WorkspaceSummary: object({ ...named, ...timestamps }),
    Workspace: object({ ...named, owner_id: id, ...timestamps }),
    WorkspaceMember: object(workspaceMember),
    WorkspaceMemberWithUser: object({ ...workspaceMember, ...memberUser }),
    Board: object(board),
    BoardDetail: object({ ...board, role }),
    BoardSummary: object({
        ...named, ...timestamps, bg_color: color, bg_image_url: board.bg_image_url, role
    }),
    BoardMemberRole: object(boardMember),
    BoardMember: object({ ...boardMember, joined_at: date }),
    BoardMemberWithUser: object({ ...boardMember, joined_at: date, ...memberUser }),
    ListSummary: object({ ...positioned, ...timestamps }),
    List: object({ ...positioned, board_id: id, ...timestamps }),
    TaskSummary: object(taskSummary),
    Task: object({
        ...taskSummary, ...taskDetails, list_id: id, created_by: { ...id, nullable: true }
    }),
    TaskDetails: object(taskDetails),
    ArchivedTask: object({ ...positioned, list_id: id, list_name: name }),
    ArchiveState: object({ ...positioned, is_archived: { type: 'boolean', example: true } }),
    MovedTask: object({ ...positioned, list_id: id, updated_at: date }),
    TaskMember: object({ task_id: id, user_id: id, ...memberUser }),
    ChecklistItem: object(checklist),
    CreatedChecklistItem: object({ ...checklist, task_id: id }),
    DeletedChecklistItem: object({ id, content: checklist.content, position }),
    Comment: object(comment),
    CommentWithUser: object({ ...comment, ...memberUser }),
    LabelSummary: object(label),
    Label: object({ ...label, board_id: id }),
    TaskLabel: object({ task_id: id, label_id: id, name: label.name, color: label.color }),

    SignupInput: object({
        username: { type: 'string', minLength: 1, maxLength: 50 },
        password: { type: 'string', format: 'password', minLength: 1 },
        email: { type: 'string', format: 'email', maxLength: 255 },
        name: { type: 'string', minLength: 1, maxLength: 100 }
    }),
    LoginInput: object({
        username: { type: 'string', minLength: 1 },
        password: { type: 'string', format: 'password', minLength: 1 }
    }),
    WorkspaceInput: nameInput(100),
    BoardInput: nameInput(100),
    BoardUpdateInput: object({
        name: { type: 'string', minLength: 1, maxLength: 100 },
        bg_color: color, bg_image_url: { type: 'string', nullable: true }
    }, ['name']),
    InviteMemberInput: object({ username: { type: 'string', minLength: 1 } }),
    MemberRoleInput: object({ role: { type: 'string', enum: ['admin', 'member'] } }),
    ListInput: nameInput(50),
    TaskInput: nameInput(100),
    PositionInput: object({ position }),
    MoveTaskInput: object({ list_id: id, position }),
    TaskDetailsInput: {
        ...object({
            name: { type: 'string', maxLength: 100 },
            description: { type: 'string', nullable: true },
            is_done: { type: 'boolean' },
            due_date: { type: 'string', format: 'date-time', nullable: true },
            start_date: { type: 'string', format: 'date-time', nullable: true },
            cover_color: color
        }, []),
        minProperties: 1, additionalProperties: false,
        description: 'Send at least one listed field. Current SQL uses COALESCE: null keeps the existing value; it does not clear dates, description, or cover color.'
    },
    TaskMemberInput: object({ targetUserId: id }),
    TaskLabelInput: object({ labelId: id }),
    ChecklistInput: object({ content: { type: 'string', minLength: 1 } }),
    ChecklistUpdateInput: {
        ...object({ content: { type: 'string' }, is_done: { type: 'boolean' } }, []),
        minProperties: 1, additionalProperties: false
    },
    CommentInput: object({ content: { type: 'string', minLength: 1 } }),
    LabelInput: object({
        name: { type: 'string', minLength: 1, maxLength: 50 },
        color: { type: 'string', minLength: 1, maxLength: 10 }
    }),
    LabelNameInput: nameInput(50),
    UpdateProfileInput: {
        ...object({
            name: {
                type: 'string', minLength: 1, maxLength: 100,
                description: 'Trimmed before validation; must contain 1–100 characters after trimming.'
            },
            avatar_url: {
                type: 'string', format: 'uri', nullable: true,
                minLength: 1, maxLength: 2048,
                description: 'HTTP(S) URL without embedded username/password. null removes the avatar; omitting this field preserves it.'
            }
        }, []),
        minProperties: 1,
        additionalProperties: false
    },
    ChangePasswordInput: {
        ...object({
            currentPassword: {
                type: 'string', format: 'password', writeOnly: true,
                minLength: 1, maxLength: 1024,
                description: 'Current password. The backend additionally limits its UTF-8 encoding to 1024 bytes. Whitespace is preserved.'
            },
            newPassword: {
                type: 'string', format: 'password', writeOnly: true,
                minLength: 15, maxLength: 72,
                description: 'At least 15 characters and at most 72 UTF-8 bytes, not whitespace-only, and different from the current password. Whitespace is preserved. The byte limit is enforced by the backend in addition to the character limits in this schema.'
            }
        }),
        additionalProperties: false
    },
};

const pathId = (name: string, description: string, example = 1): Parameter => ({
    name, in: 'path', required: true, description,
    schema: { type: 'integer', minimum: 1 }, example
});
const jsonResponse = (description: string, schema: Schema): Schema => ({
    description, content: { 'application/json': { schema } }
});
const refreshCookieHeader: Schema = {
    description: 'Stores or replaces the opaque refresh token. HttpOnly; SameSite=Lax; Path=/api/auth; expires with the session, 7 days after login. Secure is added in production. The raw refresh token is never returned in JSON.',
    schema: { type: 'string' },
    example: 'trellone_refresh=<opaque-refresh-token>; Path=/api/auth; Expires=<session-expiry>; HttpOnly; SameSite=Lax'
};
const clearedRefreshCookieHeader: Schema = {
    description: 'Expires trellone_refresh using the same cookie path and security attributes. Secure is added in production.',
    schema: { type: 'string' },
    example: 'trellone_refresh=; Path=/api/auth; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
};
const trustedOriginDescription = 'Requires an Origin matching FRONTEND_ORIGIN or API_ORIGIN (defaults: http://localhost:5173 and http://localhost:3636). Missing or untrusted Origin returns 403. The browser supplies Origin automatically; in Postman, add an allowed Origin manually.';
const errorDefinitions: Record<number, { name: string; description: string }> = {
    400: { name: 'BadRequest', description: 'Invalid/missing data, invalid role, or position out of range.' },
    401: { name: 'Unauthorized', description: 'Missing/invalid/expired Bearer JWT, invalid login credentials, or missing/invalid/expired/reused refresh token or revoked session. Auth errors may include code.' },
    403: { name: 'Forbidden', description: 'Membership or role is insufficient, the owner is protected, or login/refresh/logout/password change has a missing or untrusted Origin.' },
    404: { name: 'NotFound', description: 'Resource/member not found, or access is not disclosed.' },
    409: { name: 'Conflict', description: 'The user is already a member, or the password changed concurrently before the update could complete. For a password conflict, log in again.' },
    429: { name: 'TooManyRequests', description: 'The login/refresh limit for this IP or the password-change limit for this account was exceeded. Retry after the indicated wait.' },
    500: { name: 'InternalServerError', description: 'Unexpected server or database error.' }
};

interface OperationOptions {
    operationId: string;
    tag: string;
    summary: string;
    response: Schema;
    responseDescription?: string;
    responseHeaders?: Record<string, Schema>;
    responseOverrides?: Record<number, Schema>;
    description?: string;
    status?: 200 | 201;
    errors?: number[];
    public?: boolean;
    security?: SecurityRequirement[];
    request?: {
        schema: string;
        example: unknown;
        examples?: Record<string, { summary: string; value: unknown }>;
    };
}

const operation = (options: OperationOptions) => ({
    operationId: options.operationId,
    tags: [options.tag],
    summary: options.summary,
    ...(options.description ? { description: options.description } : {}),
    ...(options.security !== undefined
        ? { security: options.security }
        : options.public ? { security: [] } : {}),
    ...(options.request ? {
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: ref(options.request.schema),
                    ...(options.request.examples
                        ? { examples: options.request.examples }
                        : { example: options.request.example })
                }
            }
        }
    } : {}),
    responses: {
        [options.status ?? 200]: {
            ...jsonResponse(
                options.responseDescription ?? (options.status === 201 ? 'Created successfully.' : 'Request completed successfully.'),
                options.response
            ),
            ...(options.responseHeaders ? { headers: options.responseHeaders } : {})
        },
        ...Object.fromEntries((options.errors ?? [401, 500]).map(status => [
            status, { $ref: '#/components/responses/' + errorDefinitions[status].name }
        ])),
        ...options.responseOverrides
    }
});

export const swaggerDocument = {
    openapi: '3.0.3',
    info: {
        title: 'Trellone API',
        version: '1.0.0',
        description: [
            'REST API for the Trellone task management application.',
            'Login returns accessToken and user in JSON, and sets the HttpOnly trellone_refresh cookie. Access JWTs live for at most 15 minutes. Sessions expire 7 days after login; refresh does not extend this deadline. Auth responses use Cache-Control: no-store.',
            'Protected operations inherit bearerAuth. Health, signup, and login do not require Bearer auth. Refresh uses the refresh cookie, even when the access token has expired. Logout accepts an optional refresh cookie.',
            'Protected requests verify both the access JWT and its session. A missing, revoked, or expired session returns 401 with code SESSION_REVOKED even when the JWT has not reached exp. Log in again; refresh cannot restore a revoked session. Requests already authenticated before revocation may finish.',
            'Swagger test flow: open /api-docs on the allowed backend origin, execute login, then paste accessToken into Authorize without the Bearer prefix. Execute refresh to rotate the browser cookie, then manually replace the Bearer value in Authorize with the returned accessToken. Execute the logout endpoint to revoke the session.',
            'The browser stores and sends the HttpOnly cookie automatically for this same-origin Swagger UI. Do not paste refresh tokens into Authorize or try to set Cookie/Origin headers in Swagger UI. Inspect cookies in browser DevTools; use Postman to replay an old refresh token or test a missing/untrusted Origin.',
            'Login, refresh, logout, and password change require a trusted Origin. Swagger sends the backend page origin automatically; Postman requires a manually supplied allowed Origin. Logout and refresh-token reuse revoke the affected session; a successful password change revokes every session for the account. The frontend should clear its in-memory access token after logout or a password change. The Logout button inside Authorize only forgets the Bearer value; it does not call the logout endpoint.',
            'Paths follow the canonical URLs in the Postman collection. Existing nested route aliases use the same handlers.',
            'Schemas describe the API contract; input validation and authorization are enforced by the backend.'
        ].join('\n\n')
    },
    servers: [{ url: '/api', description: 'Current backend origin and port' }],
    tags: [
        { name: 'Health', description: 'Server status.' },
        { name: 'Auth', description: 'Signup, login, refresh token rotation, logout, current account, profile updates, and password changes.' },
        { name: 'Workspaces', description: 'Owned and shared workspaces.' },
        { name: 'Workspace Members', description: 'Workspace invitations and roles.' },
        { name: 'Boards', description: 'Board metadata and backgrounds.' },
        { name: 'Board Members', description: 'Board membership, independent of workspace membership.' },
        { name: 'Lists', description: 'Board columns ordered by zero-based position.' },
        { name: 'Tasks', description: 'Cards, archive, partial updates, reorder, and move.' },
        { name: 'Task Members', description: 'Assign existing board members to a task.' },
        { name: 'Checklists', description: 'Checklist items inside a task.' },
        { name: 'Comments', description: 'Task comments; only the author can edit/delete their comment.' },
        { name: 'Labels', description: 'Labels belonging to a board.' },
        { name: 'Task Labels', description: 'Attach/detach labels from the same board as the task.' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http', scheme: 'bearer', bearerFormat: 'JWT',
                description: 'Paste accessToken returned by login or refresh, without the Bearer prefix. The session must still be active. Update this value manually after refresh. On SESSION_REVOKED, log in again rather than refreshing.'
            },
            cookieAuth: {
                type: 'apiKey', in: 'cookie', name: 'trellone_refresh',
                description: 'Opaque HttpOnly refresh token managed by the browser through Set-Cookie. First execute login on this backend origin; leave the cookie value in Authorize empty. Swagger UI cannot manually set the Cookie header.'
            }
        },
        schemas,
        responses: Object.fromEntries(Object.entries(errorDefinitions).map(([status, error]) => [
            error.name, {
                ...jsonResponse(error.description, ref('Error')),
                ...(Number(status) === 429 ? {
                    headers: {
                        'Retry-After': {
                            description: 'Seconds remaining before retrying the rate-limited login, refresh, or password-change request.',
                            schema: { type: 'integer', minimum: 0 }
                        }
                    }
                } : {})
            }
        ]))
    },
    security: [{ bearerAuth: [] }],
    paths: {
        '/health': {
            get: operation({
                operationId: 'getHealth', tag: 'Health', summary: 'Check server status',
                public: true, response: ref('Health'), errors: []
            })
        },
        '/auth/signup': {
            post: operation({
                operationId: 'signup', tag: 'Auth', summary: 'Register an account',
                public: true, status: 201, response: wrap('user', 'User'), errors: [400, 500],
                description: 'Creates an account. Use login afterwards to create a session and obtain an access token and refresh cookie.',
                request: {
                    schema: 'SignupInput',
                    example: { username: 'demo_user', password: 'demo_password', email: 'demo@example.com', name: 'Demo User' }
                }
            })
        },
        '/auth/login': {
            post: operation({
                operationId: 'login', tag: 'Auth', summary: 'Log in and create a refresh-token session',
                public: true, response: ref('LoginResponse'), errors: [400, 401, 403, 429, 500],
                responseDescription: 'Logged in. JSON contains accessToken and user; Set-Cookie stores the refresh token.',
                responseHeaders: { 'Set-Cookie': refreshCookieHeader },
                description: [
                    'Use an existing account. Creates a session with a fixed 7-day expiry and an access JWT valid for at most 15 minutes. The refresh token is only returned through Set-Cookie.',
                    trustedOriginDescription,
                    'Limited to 20 requests per IP per 15 minutes; successful and failed login attempts both count. Browser clients calling from a different origin must use credentials: include to accept the refresh cookie.'
                ].join('\n\n'),
                request: { schema: 'LoginInput', example: { username: 'demo_user', password: 'demo_password' } }
            })
        },
        '/auth/refresh': {
            post: operation({
                operationId: 'refresh', tag: 'Auth', summary: 'Issue an access token and rotate the refresh cookie',
                security: [{ cookieAuth: [] }], response: ref('RefreshResponse'), errors: [401, 403, 429, 500],
                responseDescription: 'Refresh succeeded. JSON contains accessToken; Set-Cookie replaces the refresh token without extending the session expiry.',
                responseHeaders: { 'Set-Cookie': refreshCookieHeader },
                description: [
                    'No request body or Bearer access token is required. Sends the trellone_refresh cookie, marks that refresh token as used, and replaces it with a new token in the same session.',
                    trustedOriginDescription,
                    'Reusing a previously consumed refresh token revokes its entire session, including the latest refresh token. Serialize refresh requests, including across browser tabs, to avoid accidental reuse.',
                    'Missing, invalid, expired, or reused tokens and revoked sessions return 401 with code REFRESH_TOKEN_INVALID and clear the cookie. Technical failures return 500 and preserve the cookie; failed rotation is rolled back.',
                    'Limited to 60 requests per IP per minute. Browser clients calling from a different origin must use credentials: include. In Swagger, log in first, execute this endpoint, then copy the returned accessToken into Authorize manually.'
                ].join('\n\n'),
                responseOverrides: {
                    401: {
                        description: 'Refresh authentication failed. The refresh cookie is cleared. A reused token also revokes its session.',
                        headers: { 'Set-Cookie': clearedRefreshCookieHeader },
                        content: {
                            'application/json': {
                                schema: ref('Error'),
                                example: { code: 'REFRESH_TOKEN_INVALID', message: 'Please log in again.' }
                            }
                        }
                    }
                }
            })
        },
        '/auth/logout': {
            post: operation({
                operationId: 'logout', tag: 'Auth', summary: 'Revoke the current session and clear the refresh cookie',
                security: [{ cookieAuth: [] }, {}], response: ref('LogoutResponse'), errors: [403, 500],
                responseDescription: 'Logged out. Any session identified by the refresh cookie is revoked, and the browser cookie is expired.',
                responseHeaders: { 'Set-Cookie': clearedRefreshCookieHeader },
                description: [
                    'No request body or Bearer access token is required. Revokes the session identified by trellone_refresh, if found, and clears the cookie. Repeating logout or sending no/unknown refresh token still returns 200.',
                    trustedOriginDescription,
                    'After the session is revoked, subsequent protected requests using its access JWT return 401 with code SESSION_REVOKED, even before exp. The frontend should also clear its in-memory access token. In Swagger, clear the Bearer value in Authorize separately; the Authorize Logout button does not call this endpoint.',
                    'Browser clients calling from a different origin must use credentials: include so the backend receives and clears the refresh cookie.'
                ].join('\n\n')
            })
        },
        '/auth/me': {
            get: operation({
                operationId: 'getMe', tag: 'Auth', summary: 'Get the currently authenticated account',
                response: ref('User'), errors: [401, 404, 500],
                description: 'Requires a valid Bearer accessToken and an active session; the refresh cookie alone does not authenticate this endpoint. Expired JWTs return ACCESS_TOKEN_EXPIRED: refresh while the session is active, update Authorize, then retry. Invalid JWTs return ACCESS_TOKEN_INVALID. Missing, revoked, or expired sessions return SESSION_REVOKED: log in again. Missing Bearer tokens return 401 with message only.'
            }),
            patch: operation({
                operationId: 'updateMe', tag: 'Auth', summary: 'Update my profile',
                response: wrap('user', 'User'), errors: [400, 401, 404, 500],
                description: 'Updates name and/or avatar_url for the authenticated Bearer account. Omitted fields remain unchanged; avatar_url: null removes the avatar. At least one supported field is required and unknown fields are rejected. The response contains the public user profile, including avatar_url, and never password_hash.',
                request: {
                    schema: 'UpdateProfileInput',
                    example: { name: 'Tien', avatar_url: null },
                    examples: {
                        rename: { summary: 'Update the display name only', value: { name: 'Tien' } },
                        avatar: { summary: 'Set an avatar URL', value: { avatar_url: 'https://example.com/avatar.png' } },
                        removeAvatar: { summary: 'Remove the avatar', value: { avatar_url: null } }
                    }
                }
            }),
        },
        '/auth/password': {
            patch: operation({
                operationId: 'changePassword', tag: 'Auth',
                summary: 'Change my password and revoke all sessions',
                response: ref('Message'), errors: [400, 401, 403, 404, 409, 429, 500],
                responseDescription: 'Password changed and all sessions revoked. The current refresh cookie is expired; clear the in-memory access token and log in again.',
                responseHeaders: { 'Set-Cookie': clearedRefreshCookieHeader },
                description: [
                    'Requires a valid Bearer accessToken and an active session. The account ID comes from the access token.',
                    trustedOriginDescription,
                    'Verifies the current password, then updates its hash and revokes every session for the account in one transaction. The current refresh cookie is cleared only after the transaction commits. Subsequent requests using old access JWTs return SESSION_REVOKED; refresh tokens from those sessions also stop working.',
                    'An incorrect current password returns 400, not 401. Invalid new passwords or unsupported fields also return 400. If the stored password changes between verification and the update, the request returns 409 without overwriting it.',
                    'Limited to 5 attempts per authenticated account per 15 minutes. Requests reaching this limiter count whether they succeed or fail. Changing IP or session does not reset the account quota in the current backend process.',
                    'Browser clients calling from a different origin must use credentials: include so the refresh cookie can be cleared. After success, clear the in-memory access token and user state, then return to login. In Swagger, log in again and replace the value in Authorize.'
                ].join('\n\n'),
                request: {
                    schema: 'ChangePasswordInput',
                    example: {
                        currentPassword: 'your-current-password',
                        newPassword: 'a-new-long-passphrase'
                    }
                }
            })
        },
        '/workspaces': {
            post: operation({
                operationId: 'createWorkspace', tag: 'Workspaces', summary: 'Create a workspace',
                description: 'The authenticated user becomes its owner and a workspace member.',
                status: 201, response: wrap('workspace', 'Workspace'), errors: [400, 401, 500],
                request: { schema: 'WorkspaceInput', example: { name: 'My third Project' } }
            }),
            get: operation({
                operationId: 'getWorkspaces', tag: 'Workspaces', summary: 'List my workspaces',
                description: 'Includes owned workspaces and those where the user is a member; newest first.',
                response: arrayOf('WorkspaceSummary')
            })
        },
        '/workspaces/{id}': {
            parameters: [pathId('id', 'Workspace ID', 5)],
            put: operation({
                operationId: 'updateWorkspace', tag: 'Workspaces', summary: 'Rename a workspace',
                description: 'Workspace owner only.',
                response: wrap('workspace', 'Workspace'), errors: [400, 401, 404, 500],
                request: { schema: 'WorkspaceInput', example: { name: 'Renamed workspace' } }
            }),
            delete: operation({
                operationId: 'deleteWorkspace', tag: 'Workspaces', summary: 'Delete a workspace',
                description: 'Workspace owner only. Related database records are deleted by cascading foreign keys.',
                response: wrap('workspace', 'NamedEntity'), errors: [401, 404, 500]
            })
        },
        '/workspaces/{id}/members': {
            parameters: [pathId('id', 'Workspace ID', 5)],
            post: operation({
                operationId: 'inviteWorkspaceMember', tag: 'Workspace Members', summary: 'Invite a user by username',
                description: 'Workspace owner/admin only. Adds the existing user immediately with role member.',
                status: 201, response: wrap('member', 'WorkspaceMember'), errors: [400, 401, 403, 404, 409, 500],
                request: { schema: 'InviteMemberInput', example: { username: 'another_user' } }
            }),
            get: operation({
                operationId: 'getWorkspaceMembers', tag: 'Workspace Members', summary: 'List workspace members',
                description: 'Any workspace member can read the list.',
                response: arrayOf('WorkspaceMemberWithUser'), errors: [400, 401, 403, 500]
            })
        },
        '/workspaces/{id}/members/{userId}': {
            parameters: [pathId('id', 'Workspace ID', 5), pathId('userId', 'Target user ID', 2)],
            put: operation({
                operationId: 'updateWorkspaceMemberRole', tag: 'Workspace Members', summary: 'Change a workspace member role',
                description: 'Workspace owner only. The owner role cannot be changed; new role must be admin or member.',
                response: wrap('updatedMember', 'WorkspaceMember'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'MemberRoleInput', example: { role: 'admin' } }
            }),
            delete: operation({
                operationId: 'removeWorkspaceMember', tag: 'Workspace Members', summary: 'Remove a workspace member',
                description: 'Workspace owner only. The owner cannot be removed.',
                response: ref('Message'), errors: [400, 401, 403, 404, 500]
            })
        },
        '/workspaces/{workspaceId}/boards': {
            parameters: [pathId('workspaceId', 'Workspace ID', 5)],
            post: operation({
                operationId: 'createBoard', tag: 'Boards', summary: 'Create a board in a workspace',
                description: 'Workspace owner/admin only. The creator becomes the board owner.',
                status: 201, response: wrap('board', 'Board'), errors: [400, 401, 403, 500],
                request: { schema: 'BoardInput', example: { name: 'My second board' } }
            }),
            get: operation({
                operationId: 'getBoardsByWorkspace', tag: 'Boards', summary: 'List my boards in a workspace',
                description: 'Only boards where the current user is a board member are returned; most recently updated first.',
                response: arrayOf('BoardSummary')
            })
        },
        '/boards/{id}': {
            parameters: [pathId('id', 'Board ID', 2)],
            get: operation({
                operationId: 'getBoardById', tag: 'Boards', summary: 'Get board metadata and my role',
                description: 'Board members only. Fetch lists and tasks through their own endpoints.',
                response: ref('BoardDetail'), errors: [401, 404, 500]
            }),
            put: operation({
                operationId: 'updateBoard', tag: 'Boards', summary: 'Update board name and background',
                description: 'Board owner/admin only. name is required. Omitted background fields are stored as null by the current UPDATE.',
                response: wrap('board', 'Board'), errors: [400, 401, 403, 404, 500],
                request: {
                    schema: 'BoardUpdateInput',
                    example: { name: 'My first board renamed', bg_color: '#8da87e', bg_image_url: null }
                }
            }),
            delete: operation({
                operationId: 'deleteBoard', tag: 'Boards', summary: 'Delete a board',
                description: 'Board owner only. Lists, tasks, and related database records are deleted by cascading foreign keys.',
                response: wrap('deletedBoard', 'NamedEntity'), errors: [401, 404, 500]
            })
        },
        '/boards/{id}/members': {
            parameters: [pathId('id', 'Board ID', 2)],
            post: operation({
                operationId: 'inviteBoardMember', tag: 'Board Members', summary: 'Invite a user to a board by username',
                description: 'Board owner only. The target need not be a workspace member.',
                status: 201, response: wrap('member', 'BoardMember'), errors: [400, 401, 403, 404, 409, 500],
                request: { schema: 'InviteMemberInput', example: { username: 'another_user' } }
            }),
            get: operation({
                operationId: 'getBoardMembers', tag: 'Board Members', summary: 'List board members',
                description: 'Board owner/admin only in the current permission model.',
                response: arrayOf('BoardMemberWithUser'), errors: [400, 401, 403, 500]
            })
        },
        '/boards/{id}/members/{userId}': {
            parameters: [pathId('id', 'Board ID', 2), pathId('userId', 'Target user ID', 2)],
            put: operation({
                operationId: 'updateBoardMemberRole', tag: 'Board Members', summary: 'Change a board member role',
                description: 'Board owner only. The owner role cannot be changed; new role must be admin or member.',
                response: wrap('updatedMember', 'BoardMemberRole'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'MemberRoleInput', example: { role: 'admin' } }
            }),
            delete: operation({
                operationId: 'removeBoardMember', tag: 'Board Members', summary: 'Remove a board member',
                description: 'Board owner only. The owner cannot be removed.',
                response: ref('Message'), errors: [400, 401, 403, 404, 500]
            })
        },
        '/boards/{id}/archived-tasks': {
            parameters: [
                pathId('id', 'Board ID', 2),
                {
                    name: 'limit', in: 'query', required: false,
                    description: 'Maximum number of archived tasks to return.',
                    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, example: 20
                },
                {
                    name: 'offset', in: 'query', required: false,
                    description: 'Number of archived tasks to skip.',
                    schema: { type: 'integer', minimum: 0, default: 0 }, example: 0
                }
            ],
            get: operation({
                operationId: 'getArchivedTasksByBoard', tag: 'Tasks', summary: 'List archived tasks in a board',
                description: 'Board members only. Ordered by list position, task position, then task ID. Toggle a returned task back to active with PATCH /tasks/{id}/archive.',
                response: arrayOf('ArchivedTask'), errors: [400, 401, 404, 500]
            })
        },
        '/boards/{boardId}/lists': {
            parameters: [pathId('boardId', 'Board ID', 2)],
            post: operation({
                operationId: 'createList', tag: 'Lists', summary: 'Create a list at the end of a board',
                description: 'Any board member can create a list. Position is assigned by the backend.',
                status: 201, response: wrap('list', 'List'), errors: [400, 401, 403, 500],
                request: { schema: 'ListInput', example: { name: 'In progress' } }
            }),
            get: operation({
                operationId: 'getLists', tag: 'Lists', summary: 'List board columns in position order',
                response: arrayOf('ListSummary'), errors: [400, 401, 403, 500]
            })
        },
        '/boards/{boardId}/lists/{id}': {
            parameters: [pathId('boardId', 'Board ID', 2), pathId('id', 'List ID', 4)],
            put: operation({
                operationId: 'updateListName', tag: 'Lists', summary: 'Rename a list',
                description: 'Board members only. The list must belong to the board in the path.',
                response: wrap('list', 'PositionedEntity'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'ListInput', example: { name: 'Done' } }
            }),
            delete: operation({
                operationId: 'deleteList', tag: 'Lists', summary: 'Delete a list and close its position gap',
                description: 'Board members only. Tasks in the list are deleted by cascading foreign keys.',
                response: wrap('list', 'PositionedEntity'), errors: [400, 401, 403, 404, 500]
            })
        },
        '/boards/{boardId}/lists/{id}/position': {
            parameters: [pathId('boardId', 'Board ID', 2), pathId('id', 'List ID', 4)],
            patch: operation({
                operationId: 'reorderList', tag: 'Lists', summary: 'Reorder a list within its board',
                description: 'Board members only. Send a zero-based integer from 0 to the list count minus 1.',
                response: ref('Message'), errors: [400, 401, 403, 500],
                request: { schema: 'PositionInput', example: { position: 0 } }
            })
        },
        '/lists/{listId}/tasks': {
            parameters: [pathId('listId', 'List ID', 4)],
            post: operation({
                operationId: 'createTask', tag: 'Tasks', summary: 'Create a task at the end of a list',
                description: 'Board members only. The backend assigns created_by and position.',
                status: 201, response: wrap('task', 'Task'), errors: [400, 401, 403, 500],
                request: { schema: 'TaskInput', example: { name: 'Write project documentation' } }
            }),
            get: operation({
                operationId: 'getTasksByList', tag: 'Tasks', summary: 'List active tasks in a list',
                description: 'Board members only. Archived tasks are excluded; ordered by position ascending.',
                response: arrayOf('TaskSummary'), errors: [400, 401, 403, 500]
            })
        },
        '/tasks/{id}': {
            parameters: [pathId('id', 'Task ID', 4)],
            get: operation({
                operationId: 'getTaskById', tag: 'Tasks', summary: 'Get all fields of a task',
                description: 'Board members only. Members, labels, checklist items, and comments have separate endpoints.',
                response: ref('Task'), errors: [401, 403, 404, 500]
            }),
            delete: operation({
                operationId: 'deleteTask', tag: 'Tasks', summary: 'Permanently delete a task',
                description: 'Board members only. Related records are deleted by cascading foreign keys; remaining positions are shifted.',
                response: wrap('task', 'PositionedEntity'), errors: [401, 403, 404, 500]
            })
        },
        '/tasks/{id}/archive': {
            parameters: [pathId('id', 'Task ID', 4)],
            patch: operation({
                operationId: 'toggleTaskArchive', tag: 'Tasks', summary: 'Toggle task archive state',
                description: 'Board members only. No request body. Each call toggles is_archived; repeating it restores the previous state.',
                response: wrap('task', 'ArchiveState'), errors: [401, 403, 404, 500]
            })
        },
        '/tasks/{id}/details': {
            parameters: [pathId('id', 'Task ID', 4)],
            patch: operation({
                operationId: 'updateTaskDetails', tag: 'Tasks', summary: 'Partially update task details',
                description: 'Board members only. At least one supported field is required. null means unchanged under the current COALESCE implementation.',
                response: wrap('task', 'TaskDetails'), errors: [400, 401, 403, 404, 500],
                request: {
                    schema: 'TaskDetailsInput', example: { is_done: true },
                    examples: {
                        markDone: { summary: 'Mark the task as done', value: { is_done: true } },
                        details: {
                            summary: 'Update all supported fields',
                            value: {
                                name: 'Updated task', description: 'Updated description', is_done: false,
                                start_date: '2026-10-28T09:00:00.000Z', due_date: '2026-11-01T17:00:00.000Z',
                                cover_color: '#8da87e'
                            }
                        }
                    }
                }
            })
        },
        '/tasks/{id}/position': {
            parameters: [pathId('id', 'Task ID', 4)],
            patch: operation({
                operationId: 'reorderTask', tag: 'Tasks', summary: 'Reorder a task within its current list',
                description: 'Board members only. Range is 0 to total task count in the list minus 1, including archived tasks.',
                response: ref('Message'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'PositionInput', example: { position: 0 } }
            })
        },
        '/tasks/{id}/move': {
            parameters: [pathId('id', 'Task ID', 4)],
            patch: operation({
                operationId: 'moveTask', tag: 'Tasks', summary: 'Move a task to another list in the same board',
                description: 'Board members only. list_id is the destination. position can equal the target task count to append. Cross-board moves are rejected.',
                response: wrap('task', 'MovedTask'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'MoveTaskInput', example: { list_id: 5, position: 0 } }
            })
        },
        '/tasks/{id}/members': {
            parameters: [pathId('id', 'Task ID', 4)],
            get: operation({
                operationId: 'getTaskMembers', tag: 'Task Members', summary: 'List users assigned to a task',
                response: arrayOf('TaskMember'), errors: [401, 403, 404, 500]
            }),
            post: operation({
                operationId: 'addTaskMember', tag: 'Task Members', summary: 'Assign a board member to a task',
                description: 'The requester and target must be board members. Reassigning an existing member is a no-op.',
                status: 201, response: ref('Message'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'TaskMemberInput', example: { targetUserId: 2 } }
            })
        },
        '/tasks/{id}/members/{userId}': {
            parameters: [pathId('id', 'Task ID', 4), pathId('userId', 'User ID to unassign', 2)],
            delete: operation({
                operationId: 'removeTaskMember', tag: 'Task Members', summary: 'Unassign a task member',
                description: 'Board members only. The user ID comes from the path; no JSON body is required.',
                response: ref('Message'), errors: [400, 401, 403, 404, 500]
            })
        },
        '/tasks/{id}/checklists': {
            parameters: [pathId('id', 'Task ID', 4)],
            get: operation({
                operationId: 'getChecklist', tag: 'Checklists', summary: 'List checklist items in position order',
                response: arrayOf('ChecklistItem'), errors: [401, 403, 404, 500]
            }),
            post: operation({
                operationId: 'createChecklistItem', tag: 'Checklists', summary: 'Add a checklist item',
                description: 'Board members only. Position is assigned by the backend; is_done starts as false.',
                status: 201, response: wrap('item', 'CreatedChecklistItem'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'ChecklistInput', example: { content: 'Review the implementation' } }
            })
        },
        '/tasks/{id}/checklists/{checklistId}': {
            parameters: [pathId('id', 'Task ID', 4), pathId('checklistId', 'Checklist item ID', 1)],
            patch: operation({
                operationId: 'updateChecklistItem', tag: 'Checklists', summary: 'Update checklist text or completion state',
                description: 'Board members only. Send content, is_done, or both. The item must belong to the task.',
                response: wrap('checklist', 'ChecklistItem'), errors: [400, 401, 403, 404, 500],
                request: {
                    schema: 'ChecklistUpdateInput', example: { content: 'Review completed', is_done: true },
                    examples: {
                        check: { summary: 'Complete the item', value: { is_done: true } },
                        edit: { summary: 'Edit the text', value: { content: 'Review completed' } }
                    }
                }
            }),
            delete: operation({
                operationId: 'deleteChecklistItem', tag: 'Checklists', summary: 'Delete a checklist item and reorder remaining items',
                description: 'Board members only. The current response key is capitalized: Checklist.',
                response: wrap('Checklist', 'DeletedChecklistItem'), errors: [401, 403, 404, 500]
            })
        },
        '/tasks/{id}/checklists/{checklistId}/position': {
            parameters: [pathId('id', 'Task ID', 4), pathId('checklistId', 'Checklist item ID', 1)],
            patch: operation({
                operationId: 'reorderChecklistItem', tag: 'Checklists', summary: 'Reorder a checklist item within its task',
                description: 'Board members only. Position ranges from 0 to the item count minus 1.',
                response: ref('Message'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'PositionInput', example: { position: 0 } }
            })
        },
        '/tasks/{id}/comments': {
            parameters: [pathId('id', 'Task ID', 4)],
            get: operation({
                operationId: 'getComments', tag: 'Comments', summary: 'List task comments, newest first',
                description: 'Board members only. Includes author information.',
                response: arrayOf('CommentWithUser'), errors: [401, 403, 404, 500]
            }),
            post: operation({
                operationId: 'addComment', tag: 'Comments', summary: 'Add a comment to a task',
                description: 'Board members only. Author identity comes from the JWT.',
                status: 201, response: wrap('comment', 'Comment'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'CommentInput', example: { content: 'Hello again' } }
            })
        },
        '/tasks/{id}/comments/{commentId}': {
            parameters: [pathId('id', 'Task ID', 4), pathId('commentId', 'Comment ID', 1)],
            put: operation({
                operationId: 'editComment', tag: 'Comments', summary: 'Edit my comment',
                description: 'The requester must still be a board member and be the comment author. Content cannot be empty or whitespace only.',
                response: wrap('comment', 'Comment'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'CommentInput', example: { content: 'Hello again and again' } }
            }),
            delete: operation({
                operationId: 'deleteComment', tag: 'Comments', summary: 'Delete my comment',
                description: 'Board members can delete only their own comments. The current response key is capitalized: Comment.',
                response: wrap('Comment', 'Comment'), errors: [401, 403, 404, 500]
            })
        },
        '/boards/{boardId}/labels': {
            parameters: [pathId('boardId', 'Board ID', 2)],
            post: operation({
                operationId: 'createLabel', tag: 'Labels', summary: 'Create a board label',
                description: 'Board members only. Both name and color are required.',
                status: 201, response: wrap('label', 'Label'), errors: [400, 401, 403, 500],
                request: { schema: 'LabelInput', example: { name: 'Enhancement', color: '#800080' } }
            }),
            get: operation({
                operationId: 'getLabels', tag: 'Labels', summary: 'List board labels in ID order',
                response: arrayOf('LabelSummary'), errors: [400, 401, 403, 500]
            })
        },
        '/boards/{boardId}/labels/{id}': {
            parameters: [pathId('boardId', 'Board ID', 2), pathId('id', 'Label ID', 1)],
            put: operation({
                operationId: 'updateLabelName', tag: 'Labels', summary: 'Rename a board label',
                description: 'Board members only. This endpoint changes the name, not the color.',
                response: wrap('label', 'LabelSummary'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'LabelNameInput', example: { name: 'Urgent' } }
            }),
            delete: operation({
                operationId: 'deleteLabel', tag: 'Labels', summary: 'Delete a board label',
                description: 'Board members only. Task-label associations are removed by cascading foreign keys.',
                response: wrap('label', 'LabelSummary'), errors: [400, 401, 403, 404, 500]
            })
        },
        '/tasks/{id}/labels': {
            parameters: [pathId('id', 'Task ID', 4)],
            get: operation({
                operationId: 'getTaskLabels', tag: 'Task Labels', summary: 'List labels attached to a task',
                response: arrayOf('TaskLabel'), errors: [401, 403, 404, 500]
            }),
            post: operation({
                operationId: 'addTaskLabel', tag: 'Task Labels', summary: 'Attach a board label to a task',
                description: 'Board members only. The label must belong to the same board. Reattaching an existing label is a no-op.',
                status: 201, response: ref('Message'), errors: [400, 401, 403, 404, 500],
                request: { schema: 'TaskLabelInput', example: { labelId: 3 } }
            })
        },
        '/tasks/{id}/labels/{labelId}': {
            parameters: [pathId('id', 'Task ID', 4), pathId('labelId', 'Label ID to detach', 3)],
            delete: operation({
                operationId: 'removeTaskLabel', tag: 'Task Labels', summary: 'Detach a label from a task',
                description: 'Board members only. The board label itself is not deleted.',
                response: ref('Message'), errors: [400, 401, 403, 404, 500]
            })
        }
    }
};
