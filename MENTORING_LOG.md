# Nhật ký Phát triển & Mentoring - Dự án Trellone

File này được tạo tự động để ghi lại tiến trình học tập, cấu trúc dự án và các nguyên tắc làm việc giữa User và AI Mentor.

## 1. Nguyên tắc làm việc (Mentoring Guidelines)

- **Vai trò Agent:** Đóng vai trò Mentor (Người hướng dẫn), giải thích cặn kẽ các khái niệm, không viết code thay hoàn toàn mà cung cấp code mẫu kèm giải thích để User tự gõ/copy và thực sự hiểu.
- **Mục tiêu:** Hướng dẫn User tự tay làm một dự án thực tế từ đầu (Trellone - clone của Trello), bắt đầu từ hệ thống Backend.
- **Phong cách:** Giải thích các khái niệm phức tạp (như MVC, HTTP Status Codes, Promise, JWT) dễ hiểu.
- **Quản lý source code:** Hướng dẫn User thực hành chặt chẽ quy trình Git Branching chuẩn của các công ty công nghệ (Git Flow).

## 2. Mục tiêu công nghệ của User

- **Backend:** Node.js, Express, TypeScript.
- **Cơ sở dữ liệu:** PostgreSQL (Đã có sẵn file `schema.sql` rất chi tiết).
- **Frontend:** Tạm thời sử dụng HTML/JS cơ bản để test, sẽ nâng cấp sau.

## 3. Những thành tựu đã đạt được (Achievements)

### Giai đoạn 1: Thiết lập Nền tảng (Setup)

- Đã cài đặt thành công hệ sinh thái TypeScript (`typescript`, `ts-node`, `nodemon`, `@types/*`) cho Backend.
- Đã thực hành thành thạo luồng Git: Commit ở các nhánh `feature` -> Merge vào `develop` -> Tạo nhánh mới.

### Giai đoạn 2: Tính năng Xác thực (Authentication)

- **API Đăng ký (`/api/auth/signup`):**
  - Hiểu cách lấy dữ liệu từ `req.body`.
  - Áp dụng mã hóa mật khẩu an toàn bằng thư viện `bcrypt`.
  - Xử lý mượt mà các lỗi Database (ví dụ: HTTP 400 khi trùng lặp email/username) và lỗi Server (HTTP 500).
- **API Đăng nhập (`/api/auth/login`):**
  - Thực hiện query kiểm tra người dùng trong Database.
  - Sử dụng `bcrypt.compare` để đối chiếu mật khẩu.
  - Hiểu và triển khai khái niệm "Thẻ ra vào" (JWT Token) bằng thư viện `jsonwebtoken`.
- **Kỹ năng kiểm thử:** Đã biết cách dùng API Client (Postman) để test trực tiếp các API chuẩn RESTful, thay vì chỉ dùng trình duyệt.

### Giai đoạn 3: Phân quyền & Middleware

- Hiểu rõ khái niệm Middleware trong Express.
- Triển khai thành công `authMiddleware` để bảo vệ các API riêng tư, bóc tách và giải mã JWT token.
- Xây dựng API `GET /api/auth/me` để lấy thông tin user hiện tại.

### Giai đoạn 4: Quản lý Không gian làm việc (Workspaces)

- Hiểu và áp dụng chuẩn RESTful API cho việc thiết kế các endpoint (`GET`, `POST`, `PUT`, `DELETE`).
- Nắm vững khái niệm `req.params` để lấy ID từ URL.
- Biết lý do vì sao không nên dùng `SELECT *` và sử dụng `RETURNING` trong PostgreSQL để tối ưu.
- Hoàn thành bộ 4 API CRUD cơ bản cho Workspaces: Tạo mới, Lấy danh sách, Sửa, Xóa.

## 4. Tình trạng Code và Git hiện tại

- **Nhánh Git hiện tại:** Đang ở `feature/workspaces` (Sắp merge vào `develop`).
- **Trạng thái cấu trúc Code:**
  - `server.ts`: Đã đăng ký thêm route `/api/workspaces`.
  - `middlewares/authMiddleware.ts`: Chứa logic xác thực JWT Token (`protect`).
  - `routes/workspaceRoutes.ts`: Quản lý các route chuẩn RESTful cho Workspace.
  - `controllers/workspaceController.ts`: Chứa toàn bộ logic CRUD cho Workspace xử lý dữ liệu qua `req.body`, `req.user`, `req.params`.

## 5. Bước tiếp theo (Next Steps)

- **Chuẩn bị:** Commit và Merge nhánh `feature/workspaces` vào `develop`.
- **Nhánh mới:** Tạo nhánh `feature/boards`.
- **Mục tiêu:** Phát triển tính năng Quản lý Bảng (Boards) bên trong từng Workspace.
