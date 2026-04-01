# 📁 Hướng dẫn sử dụng tính năng Thư mục Bài học

## Tổng quan
Tính năng Thư mục cho phép bạn tổ chức bài học theo chủ đề, giúp quản lý và tìm kiếm bài học dễ dàng hơn.

## Các tính năng chính

### 1. Tạo thư mục mới
- Vào trang "Bài học của tôi"
- Click nút **"📁 Tạo thư mục mới"**
- Điền thông tin:
  - **Tên thư mục** (bắt buộc): VD: "Tiếng Anh giao tiếp"
  - **Mô tả** (tùy chọn): Mô tả ngắn về thư mục
  - **Chọn biểu tượng**: Chọn emoji đại diện cho thư mục
  - **Chọn màu sắc**: Chọn màu để phân biệt thư mục
- Click **"Tạo thư mục"**

### 2. Xem bài học trong thư mục
- Click vào thẻ thư mục để xem tất cả bài học bên trong
- Bạn có thể:
  - Xem danh sách bài học
  - Xóa bài học
  - Chuyển đổi trạng thái công khai/riêng tư
  - Xóa bài học khỏi thư mục (bài học vẫn tồn tại, chỉ không còn trong thư mục)

### 3. Thêm bài học vào thư mục

#### Khi tạo bài học mới:
- Vào trang "Tạo bài học mới"
- Điền thông tin bài học
- Trong phần **"Chọn thư mục (tùy chọn)"**, chọn thư mục bạn muốn
- Tạo bài học như bình thường

#### Với bài học đã tồn tại:
- Vào trang "Bài học của tôi"
- Click nút **"📁 Thêm vào thư mục"** trên bài học
- Chọn thư mục từ danh sách
- Click **"Xác nhận"**

### 4. Di chuyển bài học giữa các thư mục
- Click nút **"📁 Thêm vào thư mục"** trên bài học
- Chọn thư mục mới
- Bài học sẽ được chuyển sang thư mục mới

### 5. Xóa bài học khỏi thư mục
- Trong trang chi tiết thư mục
- Click nút **"📤 Xóa khỏi thư mục"** trên bài học
- Bài học sẽ không còn trong thư mục nhưng vẫn tồn tại trong danh sách bài học của bạn

### 6. Xóa thư mục
- Click nút menu (⋮) trên thẻ thư mục
- Chọn **"🗑️ Xóa"**
- **Lưu ý**: Chỉ có thể xóa thư mục trống (không có bài học)

## Chế độ xem

Trang "Bài học của tôi" có 3 chế độ xem:

1. **Tất cả**: Hiển thị cả thư mục và bài học
2. **Thư mục**: Chỉ hiển thị các thư mục
3. **Bài học riêng lẻ**: Chỉ hiển thị bài học không thuộc thư mục nào

## Cấu trúc Database (Firebase Firestore)

### Collection: `folders`
```javascript
{
  id: string,
  name: string,
  description: string,
  creator: string,
  createdAt: Date,
  updatedAt: Date,
  color: string,
  icon: string,
  lessonCount: number
}
```

### Collection: `lessons` (đã cập nhật)
```javascript
{
  // ... các trường hiện có
  folderId: string | null  // ID của thư mục chứa bài học
}
```

## Files đã tạo/cập nhật

### Mới tạo:
- `src/types/folder.d.ts` - Type definitions cho Folder
- `src/service/folderService.ts` - Service quản lý folders
- `src/components/FolderCard.tsx` - Component hiển thị thẻ thư mục
- `src/components/modal/CreateFolderModal.tsx` - Modal tạo/chỉnh sửa thư mục
- `src/components/modal/SelectFolderModal.tsx` - Modal chọn thư mục
- `src/pages/users/FolderDetailPage.tsx` - Trang chi tiết thư mục

### Đã cập nhật:
- `src/types/lesson.d.ts` - Thêm trường `folderId`
- `src/service/lessonService.ts` - Thêm hỗ trợ folder
- `src/pages/users/MyLessons.tsx` - UI mới với folders
- `src/pages/CreateLesson.tsx` - Thêm chọn folder khi tạo
- `src/App.tsx` - Thêm routes mới

## Tips & Best Practices

1. **Tổ chức theo chủ đề**: Tạo thư mục cho từng chủ đề học (VD: Business English, IELTS Vocabulary)
2. **Sử dụng màu sắc**: Dùng màu khác nhau để phân biệt các chủ đề
3. **Icon phù hợp**: Chọn emoji phù hợp với nội dung thư mục
4. **Mô tả rõ ràng**: Viết mô tả ngắn gọn để dễ nhớ mục đích của thư mục

## Troubleshooting

**Q: Không thể xóa thư mục?**
A: Đảm bảo thư mục trống (không có bài học). Di chuyển hoặc xóa tất cả bài học trong thư mục trước.

**Q: Bài học không hiển thị trong thư mục?**
A: Kiểm tra xem bài học đã được thêm vào thư mục chưa. Reload trang nếu cần.

**Q: Muốn thay đổi thông tin thư mục?**
A: Hiện tại chưa có chức năng chỉnh sửa thư mục. Bạn có thể xóa và tạo lại thư mục mới.
