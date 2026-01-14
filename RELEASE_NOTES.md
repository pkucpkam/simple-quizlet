# 🚀 Phiên bản Cập nhật Mới - Simple Quizlet

Bản cập nhật này tập trung vào việc hoàn thiện trải nghiệm người dùng, tăng cường tính năng ôn tập và bảo mật hệ thống.

## ✨ Tính năng Mới (New Features)

### 0. 🔊 Phát âm Flashcard (Text-to-Speech)
- **Nút loa tích hợp**: Mỗi flashcard giờ đây có nút loa 🔊 ở góc trên bên phải.
- **Hỗ trợ 2 ngôn ngữ**:
  - Mặt trước (Thuật ngữ): Phát âm tiếng Anh với giọng chuẩn.
  - Mặt sau (Định nghĩa): Phát âm tiếng Việt.
- **Tốc độ tối ưu**: Phát âm ở tốc độ 0.9x để dễ nghe và hiểu hơn.
- **Giao diện thân thiện**: 
  - Icon loa màu xanh dương cho mặt trước.
  - Icon loa màu xanh lá cho mặt sau.
  - Hiệu ứng hover mượt mà.

### 1. 🔐 Hệ thống Xác thực & Bảo mật (Authentication)
- **Login Wall**: Tất cả các tính năng chính (Học, Tạo bài, Lịch sử) giờ đây yêu cầu đăng nhập mới được truy cập.
- **Xác thực Email**: Người dùng mới đăng ký phải xác thực email trước khi sử dụng tài khoản.
- **Session Management**: Cải thiện cơ chế lưu phiên đăng nhập, đảm bảo thông tin người dùng luôn sẵn sàng.

### 2. 📚 Lịch sử Học tập (Study History)
- **Tự động lưu**: Hệ thống tự động ghi lại quá trình học (thời gian, số từ thuộc) ngay khi hoàn thành bài.
- **Trang Lịch sử**: Xem lại danh sách các bài đã học, thống kê chi tiết thời gian và kết quả.
- **Học lại**: Nút "Học lại" trực tiếp từ thẻ lịch sử giúp ôn tập nhanh chóng.

### 3. 🧠 Chế độ Ôn tập Nâng cao (Advanced Review)
- **Trang Chọn bài Ôn tập mới**:
  - Giao diện dạng Bảng (Table) chuyên nghiệp giống Trang chủ.
  - Tích hợp **Tìm kiếm, Sắp xếp (Sort), và Phân trang (Pagination)**.
  - Nút "Ôn tập" chuyên biệt màu xanh lá 🟢.

- **Cải tiến Game "Ghép thẻ" (Matching Game)**:
  - Thêm nút **"Bỏ qua" (Skip)** ⏩ đặt ở góc phải màn hình, giúp người dùng chuyển bài nhanh nếu gặp khó khăn hoặc lỗi.

- **Cải tiến Chế độ "Điền từ" (Fill-in-Blank)**:
  - **Giao diện mới**: Thay input nhập liệu cũ bằng hệ thống **Ô chữ cái (Slots)** trực quan `_ _ _ _`.
  - **Hệ thống Gợi ý (Smart Hint) 💡**: 
    - Bấm nút Gợi ý để mở ngẫu nhiên 1 chữ cái.
    - Giới hạn thông minh: Không cho phép mở toàn bộ từ (luôn chừa lại ít nhất 1 ký tự cuối để người dùng tự đoán).
    - Hiển thị số lượng gợi ý còn lại.

### 4. 🏆 Bảng Xếp Hạng (Leaderboard)
- Đã thêm khung sườn cho tính năng Bảng xếp hạng.
- Hiện tại đang để trạng thái **"Coming Soon"** để tối ưu hóa hiệu năng (tránh gọi API khi chưa cần thiết).

---

## 🐛 Sửa lỗi & Tối ưu (Bug Fixes & Improvements)

- **Fix lỗi lưu lịch sử**: Sửa lỗi `uid` bị null khiến lịch sử học không hiển thị.
- **Fix lỗi kẹt Game**: Nút "Bỏ qua" trong Matching Game giúp thoát khỏi trạng thái kẹt game (nếu có).
- **Clean Code**: Loại bỏ các comment thừa, giúp mã nguồn sạch hơn và dễ bảo trì.
- **Đồng bộ giao diện**: Thống nhất thiết kế giữa trang Chủ và trang Ôn tập.

---

## 📝 Hướng dẫn sử dụng nhanh

1. **Đăng nhập/Đăng ký**: Sử dụng email thật để nhận link xác thực.
2. **Học tập**: Chọn một bài học từ trang chủ và bắt đầu học.
3. **Ôn tập**: Vào menu "Ôn tập", chọn bài cần ôn.
   - Thử tính năng **Gợi ý** trong bài tập điền từ.
   - Dùng nút **Bỏ qua** nếu muốn kết thúc nhanh game ghép thẻ.
4. **Kiểm tra lịch sử**: Vào menu "Lịch sử" để xem lại tiến độ của mình.
