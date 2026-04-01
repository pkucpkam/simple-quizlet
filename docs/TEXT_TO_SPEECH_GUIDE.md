# 🔊 Hướng dẫn sử dụng tính năng Phát âm (Text-to-Speech)

## Tổng quan
Tính năng phát âm đã được tích hợp vào flashcard để giúp bạn học phát âm chuẩn hơn khi học từ vựng.

## Cách sử dụng

### 1. Phát âm Thuật ngữ (Term)
- Khi xem mặt trước của flashcard (từ tiếng Anh)
- Nhấn vào nút loa 🔊 màu xanh dương ở góc trên bên phải
- Hệ thống sẽ phát âm từ bằng giọng tiếng Anh

### 2. Phát âm Định nghĩa (Definition)
- Lật thẻ sang mặt sau (click vào thẻ)
- Nhấn vào nút loa 🔊 màu xanh lá ở góc trên bên phải
- Hệ thống sẽ phát âm nghĩa tiếng Việt

## Lưu ý kỹ thuật

### Yêu cầu trình duyệt
- Tính năng này sử dụng **Web Speech API**
- Hỗ trợ trên các trình duyệt hiện đại:
  - ✅ Chrome/Edge (khuyên dùng)
  - ✅ Safari
  - ✅ Firefox
  - ⚠️ Một số trình duyệt có thể cần cấp quyền âm thanh

### Giọng đọc
- **Tiếng Anh**: Tự động chọn giọng tiếng Anh có sẵn trên hệ thống
- **Tiếng Việt**: Tự động chọn giọng tiếng Việt nếu có
- Nếu không tìm thấy giọng phù hợp, hệ thống sẽ dùng giọng mặc định

### Cài đặt
- **Tốc độ**: 0.9x (chậm hơn một chút so với bình thường để dễ nghe)
- **Âm lượng**: Sử dụng âm lượng hệ thống
- **Cao độ**: Mặc định (pitch = 1)

## Dependencies
```json
{
  "react-speech-kit": "^3.0.1"
}
```

## Cấu trúc code

### Type Definition
File: `src/react-speech-kit.d.ts` - Định nghĩa TypeScript cho thư viện

### Component chính
File: `src/components/Flashcard.tsx`
- Hook: `useSpeechSynthesis()` từ `react-speech-kit`
- Hàm: `handleSpeak(text, isFront)` - Xử lý phát âm

## Khắc phục sự cố

### Không nghe thấy âm thanh
1. Kiểm tra âm lượng hệ thống
2. Kiểm tra quyền âm thanh của trình duyệt
3. Thử tải lại trang (F5)

### Giọng đọc không chuẩn
- Một số hệ điều hành có thể không có giọng tiếng Việt tích hợp
- Windows 10/11: Có thể tải thêm giọng đọc từ Settings > Time & Language > Speech
- macOS: System Preferences > Accessibility > Spoken Content

### Giọng đọc bằng ngôn ngữ khác
- Đảm bảo hệ thống đã cài đặt gói ngôn ngữ phù hợp
- Web Speech API sẽ tự động chọn giọng dựa trên ngôn ngữ có sẵn

## Future improvements
- [ ] Cho phép người dùng chọn giọng đọc yêu thích
- [ ] Thêm tùy chọn điều chỉnh tốc độ đọc
- [ ] Lưu lại preferences của người dùng
- [ ] Thêm hiệu ứng animation khi đang phát âm
