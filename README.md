# YMaga - website Tạp Chí Điện Tử Tổng Hợp

## Giới thiệu
Dự án xây dựng một website tạp chí điện tử tổng hợp cho phép người dùng đọc bài viết, theo dõi topic, tìm kiếm nội dung, lưu mục yêu thích và tương tác qua bình luận, đánh giá.

Hệ thống đồng thời hỗ trợ AI moderation để phát hiện, gắn cờ và xử lý các bình luận không phù hợp, bao gồm cả văn bản và hình ảnh đính kèm.

---

## Mục tiêu dự án
- Xây dựng giao diện cho người đọc và giao diện quản trị
- Quản lý topic, bài viết, thẻ từ khóa và trạng thái bài viết
- Hỗ trợ bình luận, đánh giá, yêu thích và tìm kiếm nội dung
- Ứng dụng AI để kiểm duyệt bình luận văn bản và hình ảnh
- Hỗ trợ cá nhân hóa nội dung theo sở thích người dùng

---

## Chức năng chính

### 1. Giao diện cho người đọc

#### Trang chủ
- Hiển thị bài viết nổi bật
- Hiển thị bài viết mới nhất
- Đề xuất bài viết phù hợp với sở thích của người dùng

#### Topic
- Mỗi topic là một nhóm bài viết cùng nội dung
- Ví dụ: công nghệ, thể thao, đời sống, giải trí
- Có thể đính kèm liên kết liên quan như:
  - link xem
  - nơi mua
  - nơi đặt vé

#### Bài viết
- Bao gồm nội dung chính:
  - text
  - hình ảnh
- Người dùng có thể:
  - bình luận
  - đánh giá bài viết hoặc topic
  - đính kèm ảnh trong bình luận
- Người dùng có thể báo cáo bình luận không phù hợp
- AI có thể:
  - gắn cờ bình luận nghi ngờ vi phạm
  - tự động chặn bình luận nếu vi phạm nghiêm trọng

#### Tìm kiếm
- Tìm bài viết
- Tìm topic
- Gợi ý từ khóa hot

#### Mục ưa thích
- Lưu nội dung yêu thích
- Hỗ trợ cá nhân hóa nội dung đề xuất

---

### 2. Giao diện quản lý

#### Quản lý Topic
- Tạo mới topic
- Chỉnh sửa topic
- Xóa topic
- Cập nhật mô tả và các link liên quan

#### Quản lý bài viết
- Tạo bài viết
- Chỉnh sửa bài viết
- Hỗ trợ trình soạn thảo trực quan:
  - cỡ chữ
  - in đậm
  - in nghiêng
  - gạch chân
  - căn lề
  - chèn hình ảnh
- Gắn thẻ từ khóa cho bài viết

#### Trạng thái bài viết
- Draft
- Review
- Published

#### Kiểm duyệt nội dung
- Hiển thị danh sách bình luận bị người dùng hoặc AI gắn cờ
- Hiển thị lý do bị chặn/gắn cờ
- Admin có thể chặn hoặc bỏ chặn nội dung

#### Phân quyền
- Hỗ trợ các vai trò:
  - Admin
  - Moderator
  - User

---

## AI Moderation

### Mục tiêu
Sử dụng AI để hỗ trợ kiểm duyệt bình luận, giảm tải cho moderator/admin và phát hiện sớm nội dung vi phạm.

### Phạm vi
- Phân tích văn bản trong bình luận
- Phân tích hình ảnh đính kèm trong bình luận
- Phân loại mức độ rủi ro:
  - Allow
  - Review
  - Block

### Các loại vi phạm dự kiến
- Toxic / xúc phạm
- Hate / công kích
- Spam
- Hình ảnh không phù hợp

---

## Cấu trúc thư mục

```text
Project_YIRLoDT/
├── backend/
├── data/
├── frontend/
├── logs/
├── notebooks/
├── reports/
└── README.md
