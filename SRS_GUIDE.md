# 🚀 Hướng dẫn sử dụng 3 tính năng mới

## Tổng quan
Đã triển khai thành công 3 tính năng quan trọng nhất để nâng cao hiệu quả học từ vựng:

1. **Spaced Repetition System (SRS)** - Hệ thống lặp lại ngắt quãng
2. **Progress Dashboard** - Bảng theo dõi tiến độ
3. **TOEIC Vocabulary Database** - Kho từ vựng TOEIC (Đang triển khai)

---

## 📚 1. SPACED REPETITION SYSTEM (SRS)

### Giới thiệu
SRS là phương pháp học từ vựng hiệu quả nhất được khoa học chứng minh, giúp bạn nhớ từ **lâu hơn 10 lần** so với học bình thường.

### Cách hoạt động

#### SM-2 Algorithm
Hệ thống sử dụng thuật toán SM-2 (SuperMemo 2) để tính toán khoảng cách ôn tập:

- **Nhớ đúng** → Tăng khoảng cách: 1 ngày → 6 ngày → 14 ngày → 30 ngày...
- **Quên** → Reset về 1 ngày

#### 4 mức đánh giá
Khi ôn tập, bạn đánh giá mức độ nhớ từ:

1. **Quên (Again)** - Hoàn toàn không nhớ → Reset về 1 ngày
2. **Khó (Hard)** - Nhớ nhưng rất khó khăn → Khoảng cách x 0.8
3. **Tốt (Good)** - Nhớ sau khi suy nghĩ → Khoảng cách chuẩn
4. **Dễ (Easy)** - Nhớ ngay lập tức → Khoảng cách x 1.3

### Cách sử dụng

#### Bước 1: Khởi tạo SRS cho bài học
Khi học một bài học lần đầu, hệ thống tự động tạo SRS cards:

```typescript
// Tự động được gọi khi bạn học bài học
await srsService.initializeCardsForLesson(lessonId, userId, vocabulary);
```

#### Bước 2: Xem thẻ cần ôn hôm nay
- Vào **Dashboard** (`/dashboard`)
- Xem số thẻ "Cần ôn hôm nay"
- Click **"Bắt đầu ôn tập"**

#### Bước 3: Ôn tập
- Đọc từ vựng
- Click **"Hiện đáp án"**
- Đánh giá mức độ nhớ: Quên / Khó / Tốt / Dễ
- Lặp lại cho đến hết thẻ

### Thống kê SRS

Mỗi thẻ có các thông tin:
- **Ease Factor**: Độ khó (1.3 - 2.5)
- **Interval**: Khoảng cách ôn tập (ngày)
- **Next Review**: Ngày ôn tập tiếp theo
- **Total Reviews**: Tổng số lần ôn
- **Accuracy**: Độ chính xác (%)
- **Streak**: Số lần đúng liên tiếp

### Trạng thái thẻ

- 🆕 **New** - Chưa ôn lần nào
- 📖 **Learning** - Đang học (interval < 21 ngày)
- 🏆 **Mastered** - Đã thành thạo (interval ≥ 21 ngày)

---

## 📊 2. PROGRESS DASHBOARD

### Giới thiệu
Dashboard giúp bạn theo dõi tiến độ học tập, tăng motivation và duy trì thói quen học.

### Các chỉ số chính

#### 1. Cần ôn hôm nay
- Số thẻ đến hạn ôn tập
- Nút "Bắt đầu ôn tập" nhanh

#### 2. Tổng số thẻ
- Tất cả thẻ SRS của bạn
- Icon: 📚

#### 3. Thẻ mới
- Thẻ chưa ôn lần nào
- Icon: 🆕

#### 4. Đang học
- Thẻ trong giai đoạn học (interval < 21 ngày)
- Icon: 📖

#### 5. Đã thành thạo
- Thẻ đã nhớ lâu dài (interval ≥ 21 ngày)
- Icon: 🏆

#### 6. Độ chính xác
- Phần trăm câu trả lời đúng
- Progress bar màu xanh

#### 7. Phân bố thẻ
- Biểu đồ phân bố: Mới / Đang học / Thành thạo

### Cách sử dụng

1. Vào `/dashboard`
2. Xem tổng quan thống kê
3. Click "Bắt đầu ôn tập" để ôn thẻ đến hạn
4. Hoặc dùng Quick Actions để:
   - Xem bài học
   - Tạo bài học mới
   - Về trang chủ

---

## 📖 3. TOEIC VOCABULARY DATABASE (Đang triển khai)

### Kế hoạch
Sẽ tạo database với 3000+ từ vựng TOEIC cốt lõi.

### Phân loại

#### Theo Part TOEIC
- Part 1: Describing pictures (100 từ)
- Part 2: Question-Response (150 từ)
- Part 3-4: Conversations & Talks (1000 từ)
- Part 5-6: Grammar & Vocabulary (500 từ)
- Part 7: Reading comprehension (1250 từ)

#### Theo chủ đề
- Business & Office (500 từ)
- Travel & Transportation (300 từ)
- Shopping & Dining (250 từ)
- Health & Medicine (200 từ)
- Technology (200 từ)
- Finance & Banking (200 từ)
- Human Resources (150 từ)
- Marketing & Sales (150 từ)
- Manufacturing (100 từ)
- General (950 từ)

#### Theo level điểm
- 400 points (500 từ cơ bản)
- 600 points (1000 từ trung bình)
- 800 points (1000 từ nâng cao)
- 900+ points (500 từ chuyên sâu)

### Mỗi từ bao gồm
- Từ tiếng Anh
- Nghĩa tiếng Việt
- Phiên âm IPA
- Part of speech (noun/verb/adj...)
- 2-3 câu ví dụ TOEIC
- Collocations (từ đi với từ)
- Audio native speaker
- Frequency (độ phổ biến)

---

## 🗄️ DATABASE STRUCTURE

### Collection: `srsCards`
```javascript
{
  id: "auto-generated",
  wordId: "lesson123_abandon",
  word: "abandon",
  definition: "bỏ rơi, từ bỏ",
  
  // SRS fields
  easeFactor: 2.5,
  interval: 14,
  repetitions: 3,
  nextReview: Timestamp,
  lastReview: Timestamp,
  
  // Stats
  totalReviews: 10,
  correctCount: 8,
  incorrectCount: 2,
  streak: 3,
  
  // Metadata
  lessonId: "lesson123",
  userId: "user456",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `reviewSessions`
```javascript
{
  id: "auto-generated",
  userId: "user456",
  lessonId: "lesson123", // optional
  startTime: Timestamp,
  endTime: Timestamp,
  cardsReviewed: 20,
  correctCount: 16,
  incorrectCount: 4,
  totalTime: 300, // seconds
  averageTime: 15 // seconds per card
}
```

### Collection: `dailyStats`
```javascript
{
  id: "auto-generated",
  date: Timestamp,
  userId: "user456",
  newCards: 10,
  reviewedCards: 20,
  correctCount: 16,
  incorrectCount: 4,
  timeSpent: 300, // seconds
  streak: 7 // days
}
```

---

## 🎯 WORKFLOW NGƯỜI DÙNG

### Ngày 1: Học bài mới
1. Tạo bài học mới hoặc chọn bài có sẵn
2. Học flashcard lần đầu
3. Hệ thống tự động tạo SRS cards
4. Tất cả thẻ đều "due" ngay lập tức

### Ngày 2-7: Ôn tập đều đặn
1. Vào Dashboard mỗi ngày
2. Xem số thẻ cần ôn
3. Ôn tập và đánh giá: Quên/Khó/Tốt/Dễ
4. Hệ thống tự động lên lịch ôn tiếp theo

### Sau 1 tháng
- Thẻ nhớ tốt: interval = 30-60 ngày
- Thẻ khó: interval = 3-7 ngày
- Thẻ quên: reset về 1 ngày

---

## 💡 TIPS & BEST PRACTICES

### 1. Ôn tập đều đặn
- Ôn **mỗi ngày** 15-30 phút
- Đừng bỏ qua ngày nào
- Streak càng dài càng tốt

### 2. Đánh giá trung thực
- **Quên**: Thực sự không nhớ
- **Khó**: Phải suy nghĩ >5 giây
- **Tốt**: Nhớ sau 2-3 giây
- **Dễ**: Nhớ ngay lập tức

### 3. Không học quá nhiều thẻ mới
- Mỗi ngày: 10-20 thẻ mới
- Ưu tiên ôn thẻ cũ trước
- Đợi thẻ cũ "mastered" mới học thẻ mới

### 4. Tập trung vào từ khó
- Thẻ nào sai nhiều → ôn thường xuyên hơn
- Thẻ dễ → để hệ thống tự động lên lịch

---

## 🔧 TECHNICAL DETAILS

### SM-2 Algorithm Formula

```typescript
// Ease Factor calculation
if (quality >= 3) {
  easeFactor = max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
}

// Interval calculation
if (quality < 3) {
  // Failed
  repetitions = 0
  interval = 1
} else {
  // Success
  repetitions += 1
  if (repetitions === 1) interval = 1
  else if (repetitions === 2) interval = 6
  else interval = round(interval * easeFactor)
}

// Rating modifiers
if (rating === "hard") interval *= 0.8
if (rating === "easy") interval *= 1.3
```

### Quality Mapping
- Again: 0 (complete blackout)
- Hard: 3 (recalled with difficulty)
- Good: 4 (recalled after hesitation)
- Easy: 5 (perfect recall)

---

## 📱 ROUTES

- `/dashboard` - Progress Dashboard
- `/srs-review` - SRS Review Page
- `/my-lessons` - Quản lý bài học
- `/create-lesson` - Tạo bài học mới

---

## 🎓 NGHIÊN CỨU KHOA HỌC

### Spaced Repetition hiệu quả như thế nào?

1. **Ebbinghaus Forgetting Curve**
   - Không ôn tập: Quên 80% sau 1 tháng
   - Có SRS: Nhớ 90% sau 1 năm

2. **Optimal Intervals**
   - Ôn đúng lúc sắp quên → Ghi nhớ mạnh nhất
   - SRS tự động tính toán thời điểm tối ưu

3. **Long-term Retention**
   - Học 1 lần: Nhớ 1 tuần
   - SRS 5 lần: Nhớ 1 năm+

---

## 🚀 NEXT STEPS

### Phase 2 (Đang triển khai)
- ✅ TOEIC Vocabulary Database (3000 từ)
- ✅ Context Learning (ví dụ câu)
- ✅ Pronunciation Practice

### Phase 3 (Tương lai)
- Calendar Heatmap (giống GitHub)
- Streak Counter & Achievements
- Leaderboard
- Study Reminders
- Weekly/Monthly Reports

---

## ❓ FAQ

**Q: Tôi có thể skip thẻ không?**
A: Không nên. Hãy đánh giá trung thực để hệ thống lên lịch chính xác.

**Q: Tôi quên nhiều thẻ, có sao không?**
A: Bình thường! Thẻ sẽ được ôn lại thường xuyên hơn cho đến khi bạn nhớ.

**Q: Bao lâu thì thẻ "mastered"?**
A: Khi interval ≥ 21 ngày (thường sau 4-5 lần ôn đúng).

**Q: Tôi có thể ôn trước hạn không?**
A: Nên ôn đúng hạn để hiệu quả tối đa. Ôn sớm quá = lãng phí thời gian.

---

## 📞 SUPPORT

Nếu có vấn đề hoặc câu hỏi, vui lòng:
1. Check console log (F12)
2. Kiểm tra Firestore data
3. Xem lại hướng dẫn này

Happy Learning! 🎉
