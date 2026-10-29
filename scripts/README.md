# Dữ liệu demo Trellone

Script `seed.cjs` được viết theo schema trong `trello_db.sql` (PostgreSQL 17).
Script **chỉ thêm dữ liệu**, không chạy `DELETE`, `TRUNCATE` hoặc cập nhật tài khoản/dữ liệu cũ.

## Chạy

Đứng trong thư mục `backend`, sử dụng các thư viện đã có trong dự án:

```powershell
# Xem số lượng và kiểm tra dữ liệu. Không mở kết nối database.
npm run seed:preview

# Ghi dữ liệu vào database được cấu hình trong backend/.env.
npm run seed

# Chạy các kiểm thử của bộ tạo dữ liệu.
npm run test:seed
```

Trên PowerShell, nếu `npm.ps1` bị chặn bởi execution policy, dùng `npm.cmd` thay cho `npm`
(ví dụ `npm.cmd run seed`). Không cần thay đổi execution policy.

Kết nối sử dụng `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, giống backend.
Database và các bảng phải tồn tại trước; script không tạo hoặc thay đổi schema ứng dụng.
Toàn bộ lần seed nằm trong một transaction. Lỗi ở bất kỳ bảng nào sẽ rollback tất cả các dòng vừa thêm.
Như các INSERT thông thường của PostgreSQL, sequence có thể đã tăng sau rollback; ID không cần liên tục.

## Tài khoản đăng nhập

Mật khẩu demo mặc định cho các tài khoản mới: **`TrelloneDemo@123`**.
Mật khẩu được hash bằng bcrypt với cost 10, tương thích `authService.login()`.
Các tài khoản này phục vụ phát triển và demo.

| Username | Quyền trong workspace/board đầu tiên |
|---|---|
| `seed_owner` | Owner của workspace và board đầu tiên |
| `seed_admin` | Admin; có thể tạo board và mời thành viên workspace |
| `seed_member` | Thành viên thường |
| `seed_guest` | Thành viên chỉ của board đầu tiên; không thuộc workspace nào |
| `seed_outsider` | Có tài khoản nhưng không thuộc workspace/board nào |

Các tài khoản còn lại là `seed_user01` đến `seed_user25` ở bộ mặc định.
Một số board khác do `seed_admin` sở hữu để thử quyền giữa các board khác nhau.
Guest có thể gọi API trực tiếp với ID board đầu tiên, dù danh sách workspace của guest rỗng.

Sau khi seed thành công, terminal in `examples.workspaceId`, `boardId`, `listId`, `taskId` thật
để bạn dùng ngay với Swagger/Postman. Không giả định ID mới bắt đầu từ 1.

Có thể đặt biến môi trường `SEED_PASSWORD` trước lần seed đầu tiên để dùng mật khẩu khác.
Chạy lại không đổi mật khẩu của các tài khoản đã seed.

## Quy mô mặc định

| Bảng | Dòng mới |
|---|---:|
| users | 30 |
| workspaces | 7 |
| workspace_members | 69 |
| boards | 25 |
| board_members | 268 |
| lists | 121 |
| labels | 144 |
| tasks | 1.800 |
| task_members | 3.600 |
| task_labels | 3.600 |
| checklist_items | 7.200 |
| comments | 3.600 |
| attachments | 180 |
| activities | 6.188 |
| **Tổng** | **26.832** |

Trong 1.800 task có 164 task archive, 520 task hoàn thành, 341 task đang quá hạn
và chưa hoàn thành/archive, 450 task chưa đặt hạn. Có mô tả dài, mô tả trống, màu cover,
ngày bắt đầu, nhiều thành viên/nhãn, checklist hoàn thành một phần và comment tiếng Việt.
Các nhóm này có thể giao nhau.

Có thêm một workspace rỗng, một board rỗng và một list rỗng để thử empty state.
Vị trí list, task (kể cả task archive) và checklist bắt đầu từ 0, liên tục trong từng tài nguyên cha.
Thành viên task, tác giả comment và người tải file đều thuộc board; nhãn luôn thuộc đúng board của task.

**Attachment chỉ là metadata mẫu.** URL dùng `example.invalid`, không phải file đã upload và không tải xuống được.
Khi triển khai upload/download, thay chúng bằng file thật hoặc thêm attachment qua API.
Avatar và ảnh nền để `null`; board và task có màu nền/cover để thử giao diện mà không phụ thuộc dịch vụ ảnh ngoài.

## Đổi quy mô, namespace và ngày tham chiếu

```powershell
# Bộ nhỏ: 12 tài khoản, 160 task.
npm run seed -- --size small --namespace small_demo

# Bộ lớn: 60 tài khoản, 9.000 task.
npm run seed -- --size large --namespace big_demo

# Chọn ngày tham chiếu cố định để tái lập dữ liệu.
npm run seed -- --namespace demo2 --date 2026-10-29

# Xem trợ giúp.
npm run seed -- --help
```

Ngày mặc định là ngày chạy theo múi giờ `Asia/Ho_Chi_Minh`. Timestamp được ghi theo giờ Việt Nam,
phù hợp các cột `timestamp without time zone` trong dump. Ngày hạn được tạo tương đối quanh ngày tham chiếu.

Namespace mặc định là `seed`: username có tiền tố `seed_`, email thuộc `seed.trellone.test`,
tên workspace/board có tiền tố `[seed]`. Namespace khác tạo một bộ demo độc lập.

Chạy lại cùng namespace đã hoàn tất sẽ báo `already-seeded`, không thêm trùng và không ghi đè dữ liệu
bạn đã sửa qua giao diện. Đổi size/date/password với namespace cũ cũng không làm mới bộ đã tồn tại;
dùng namespace mới nếu muốn thêm bộ khác.

Nếu namespace chỉ khớp một phần hoặc trùng tài khoản có email khác, script dừng và rollback.
Không tự nhận tài khoản có sẵn làm tài khoản demo. Advisory lock ngăn hai lần seed cùng namespace ghi trùng đồng thời.

Trong dump ban đầu chỉ có 5 user, 4 workspace, 2 board, 8 list và 3 task.
Các dòng đó được giữ nguyên; dữ liệu demo nằm trong các workspace/board mới.

## Hoàn tác một bộ seed

```powershell
# Chỉ xem các dòng thuộc big_demo sẽ bị xóa.
npm.cmd run seed:remove -- --namespace big_demo

# Backup SQL trước, sau đó xóa riêng namespace đã chỉ định.
npm.cmd run seed:remove -- --namespace big_demo --apply
```

Script xóa activities liên quan, workspace cùng các bảng con theo cascade, rồi tài khoản của namespace.
Dữ liệu của namespace khác được giữ lại. Nếu tài khoản seed có tham chiếu sang dữ liệu ngoài bộ này,
script dừng để tránh thay đổi dữ liệu khác. Mặc định chỉ preview; phải có `--apply` mới ghi database.

Bản backup khôi phục nằm trong `backend/.seed-backups/<namespace>-<timestamp>.sql` và được bỏ qua bởi Git.
Muốn khôi phục bộ vừa xóa, mở file backup đó bằng Query Tool của pgAdmin và chạy trên cùng database.
Không đặt lại sequence: ID của các dòng còn lại được giữ nguyên và các INSERT sau vẫn dùng ID mới.
