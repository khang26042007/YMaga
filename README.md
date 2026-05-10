# YMaga - Dự án Tạp chí Điện tử Tổng hợp

## 1. Tổng quan dự án
**YMaga** là hệ thống tạp chí điện tử hiện đại, cho phép người dùng cập nhật tin tức, theo dõi các chủ đề yêu thích và tương tác. Hệ thống được chia thành hai phân hệ: Người dùng (User) và Quản trị (Admin/Moderator).

## 2. Công nghệ sử dụng (Frontend)
- **Ngôn ngữ:** TypeScript (đảm bảo an toàn kiểu dữ liệu và bắt lỗi dữ liệu từ Backend).
- **Giao diện:** HTML5, CSS3 (Sử dụng CSS Variables, Flexbox, Grid Layout).

## 3. Chi tiết các phần Frontend kết nối Backend

### A. Phân hệ Người dùng (User Site)
Mọi yêu cầu đều được thực hiện với cấu hình `credentials: 'include'` để xác thực qua Cookie.

* **Xác thực tài khoản:**
    * **Đăng nhập:** `POST /user/login`
    * **Đăng ký:** `POST /user/register`
    * **Kiểm tra phiên:** `GET /user/verify`
    * **Đăng xuất:** `GET /user/logout`
* **Trang chủ & Tìm kiếm:**
    * **Bài viết nổi bật:** `GET /home/featured`
    * **Bài viết mới nhất:** `GET /home/latest`
    * **Danh sách chủ đề:** `GET /home/topics`
    * **Tìm kiếm:** `GET /search/query`
* **Trang cá nhân (Profile):**
    * **Thay đổi thông tin:** `POST /user/edit` (Tên, Bio, Avatar)
    * **Đổi mật khẩu:** `POST /user/password-change`
    * **Danh sách yêu thích:** `GET /user/liked-topics` và `GET /user/liked-posts`
* **Tương tác Chủ đề (Topic):**
    * **Chi tiết & Bài viết:** `GET /topic/{id}` và `GET /topic/{id}/posts`
    * **Yêu thích:** `GET /topic/{id}/favorite` (Xem trạng thái) và `POST /topic/{id}/update-favorite` (Cập nhật)
    * **Đánh giá:** `GET /topic/{id}/ratings` (Xem thông tin) và `POST /topic/{id}/rating` (Gửi đánh giá)
* **Tương tác Bài viết (Post):**
    * **Chi tiết:** `GET /post/{id}`
    * **Yêu thích:** `GET /post/{id}/favorite` (Xem trạng thái) và `POST /post/{id}/update-favorite` (Cập nhật)
    * **Bình luận:** `GET /post/{id}/comments` (Danh sách), `POST /post/{id}/comment` (Đăng tải), `PUT /post/{id}/comment` (Chỉnh sửa), `DELETE /post/{id}/comment` (Xóa)
    * **Báo cáo:** `POST /post/report-comment`
* **Tiện ích khác:**
    * **Upload file:** `POST /file-upload`

### B. Phân hệ Quản trị (Admin Site)
Quản lý toàn bộ tài nguyên hệ thống, yêu cầu xác thực Admin/Mod.

* **Xác thực tài khoản:**
    * **Đăng nhập:** `POST /admin/login`
    * **Xác thực phiên:** `POST /admin/verify`
    * **Đăng xuất:** `GET /admin/logout`
* **Quản lý Chủ đề (Topics):**
    * **Danh sách & Tìm kiếm:** `GET /admin/topics` và `GET /admin/search/topics`
    * **Thông tin chính:** `POST /admin/topic` (Tạo mới), `GET /admin/topic/{id}` (Chi tiết), `PUT /admin/topic/{id}` (Chỉnh sửa), `DELETE /admin/topic/{id}` (Xóa)
    * **Quản lý Liên kết:** `POST /admin/topic/{id}/add-link` (Thêm), `PUT /admin/topic-link/{link-id}` (Sửa), `DELETE /admin/topic-link/{link-id}` (Xóa)
    * **Danh sách bài viết trong topic:** `GET /admin/topic/{id}/posts`
* **Quản lý Bài viết (Posts):**
    * **Danh sách & Tìm kiếm:** `GET /admin/posts` và `GET /admin/search/posts`
    * **Thao tác:** `POST /admin/post` (Tạo mới), `GET /admin/post/{id}` (Chi tiết), `PUT /admin/post/{id}` (Cập nhật), `DELETE /admin/post/{id}` (Xóa)
* **Kiểm duyệt Bình luận:**
    * **Danh sách bị gắn cờ:** `GET /admin/flagged-comments`
    * **Thay đổi trạng thái:** `PUT /admin/comment-moderate/{cmt-id}`
* **Quản trị viên (Users):**
    * **Danh sách Admin/Mod:** `GET /admin/users`
    * **Cấp quyền mới:** `POST /admin/user`
    * **Thay đổi/Xóa quyền:** `PUT /admin/user`

## 4. Tối ưu kỹ thuật đã thực hiện
- **Debounce Search:** Frontend đợi 500ms sau khi người dùng dừng gõ mới gọi các API Tìm kiếm (`/search/...`) để tối ưu tài nguyên máy chủ.
- **Anti-Cache:** Thêm tham số thời gian thực vào các API lấy danh sách yêu thích để đảm bảo dữ liệu luôn được cập nhật mới nhất.
- **Optimistic UI:** Xử lý ẩn thẻ bài viết ngay khi bấm "Bỏ lưu" ở trang Profile trước khi nhận phản hồi từ API để tạo cảm giác mượt mà.
