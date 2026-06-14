# Asteroid Vocabulary Match Implementation Plan

**Asteroid Vocabulary Match** là một chế độ học từ vựng tương tác theo phong cách game không gian (retro space arcade). Người chơi điều khiển một phi thuyền bảo vệ căn cứ/trái đất khỏi các thiên thạch mang đáp án khác nhau, giúp biến việc học từ vựng thành một trải nghiệm game hóa cuốn hút và kích thích phản xạ nhanh.

---

## User Review Required

> [!IMPORTANT]
> **1. Hướng tiếp cận xây dựng Game Loop (HTML/CSS absolute positioning vs. Canvas):**
> * **Giải pháp đề xuất:** Chúng tôi sẽ sử dụng **HTML/CSS absolute elements** kết hợp với một vòng lặp tọa độ nhẹ cập nhật mỗi **30ms** (`requestAnimationFrame` hoặc `setInterval`). 
> * **Lý do:** Các thiên thạch chứa văn bản tiếng Việt dài (nghĩa từ vựng). Việc vẽ và tự động xuống hàng (line-wrapping) văn bản trên Canvas rất phức tạp và dễ lỗi. Render bằng thẻ HTML giúp tận dụng hoàn toàn CSS Flexbox/Grid, bo góc mịn (border-radius), bóng đổ (box-shadow) neon cực đẹp và khả năng responsive tự nhiên của trình duyệt.
> * **Hiệu suất:** Với tối đa 5-8 thiên thạch cùng lúc trên màn hình, cách này cực kỳ mượt mà, đạt 60fps trên mọi thiết bị.

> [!TIP]
> **2. Tích hợp âm thanh cực chất bằng Web Audio API (Không cần tải file bên ngoài):**
> * Để tạo trải nghiệm Premium mà không phụ thuộc vào việc tải các file âm thanh `.mp3` nặng nề từ internet (dễ lỗi mạng, trễ tiếng), chúng tôi sẽ viết một helper **Web Audio Synthesizer** để tự sinh các âm thanh retro synth thực tế bằng code:
>   * **Laser shoot:** Tần số quét nhanh từ cao xuống thấp.
>   * **Explosion:** White noise kết hợp giảm âm lượng đột ngột (decay).
>   * **Base damaged:** Tiếng ù trầm tần số thấp kèm rung màn hình.
>   * **Combo sound:** Tiếng coin/chime cao vút.
>   * **Game Over / Victory:** Các hợp âm arpeggio cổ điển.

---

## Open Questions

*Không còn câu hỏi chưa giải quyết.*

### Quyết định thiết kế đã thống nhất
* **Thời lượng lượt chơi:** Trò chơi sẽ kết thúc khi đi qua toàn bộ danh sách từ vựng của bài học (hoặc toàn bộ danh sách thẻ SRS đến hạn ôn tập) thay vì giới hạn số lượng cố định.
* **Chế độ học:** Tập trung hoàn toàn vào việc nhận diện từ vựng cơ bản trong danh sách từ của bài học (Word → Meaning, Meaning → Word, Listening Mode, Sentence Completion).

---

## Proposed Changes

Chúng ta sẽ bổ sung các file mới và tích hợp game vào trang xem bài học hiện tại.

```
src/
├── pages/
│   └── AsteroidMatch.tsx (NEW - Trang chính chứa giao diện Game & Logic)
├── utils/
│   └── soundSynth.ts (NEW - Bộ phát âm thanh Synthesizer qua Web Audio API)
├── App.tsx (MODIFY - Đăng ký route game mới)
└── pages/
    └── LessonView.tsx (MODIFY - Thêm nút "Game Thiên Thạch" vào Action Bar)
```

---

### 1. Game Utilities & Audio Synthesizer

#### [NEW] [soundSynth.ts](file:///f:/Project/english-application/simple-quizlet/src/utils/soundSynth.ts)
Xây dựng một module synth gọn nhẹ để sinh âm thanh bằng Web Audio API.

* **laser():** Tạo âm thanh bắn đạn.
* **explosion():** Tạo âm thanh nổ khi bắn trúng thiên thạch.
* **damage():** Tạo âm thanh khi thiên thạch chạm đáy căn cứ.
* **combo():** Âm thanh vui tai khi đạt combo lớn hoặc chuỗi đúng.
* **gameWin() / gameOver():** Âm nhạc kết thúc game.

---

### 2. Router & Navigation

#### [MODIFY] [App.tsx](file:///f:/Project/english-application/simple-quizlet/src/App.tsx)
Đăng ký route mới cho game:
```tsx
<Route path="/asteroid-match/:lessonId" element={<AsteroidMatch />} />
```

#### [MODIFY] [LessonView.tsx](file:///f:/Project/english-application/simple-quizlet/src/pages/LessonView.tsx)
Thêm nút "Game Thiên Thạch" vào danh sách Action Bar:
* Thêm một `ActionButton` với icon tên lửa hoặc không gian (ví dụ: `Rocket` hoặc `Gamepad2` từ Lucide).
* Nút này sẽ điều hướng người chơi đến `/asteroid-match/${lesson.id}` kèm theo history state.

---

### 3. Core Game UI & Logic Component

#### [NEW] [AsteroidMatch.tsx](file:///f:/Project/english-application/simple-quizlet/src/pages/AsteroidMatch.tsx)
Đây là màn hình game chính, bao gồm 3 trạng thái lớn:
1. **Lobby/Setup Screen (Màn hình phòng chờ):**
   * Cho phép chọn **Chế độ học** (Word → Meaning, Meaning → Word, Listening Mode, Sentence Completion).
   * Cho phép chọn **Độ khó** (Dễ - thiên thạch rơi chậm; Trung bình - mặc định; Khó - rơi nhanh, spawn nhiều).
   * Lựa chọn nguồn từ vựng: Học toàn bộ từ hay chỉ ôn các từ Spaced Repetition (nếu bài học đã được khởi tạo SRS).
   * Nút bấm "Khởi hành phi thuyền 🚀".
2. **Gameplay Arena (Màn hình chơi game):**
   * **Bầu trời sao cuộn di động (Starfield Parallax):** Sử dụng thẻ canvas nền vẽ các chấm sao trắng nhỏ chuyển động đi xuống liên tục tạo cảm giác phi thuyền đang bay thẳng tiến vào không gian.
   * **Bảng điều khiển HUD:**
     * Thanh HP ở góc trên: 3 Trái tim (`❤️ ❤️ ❤️`). Bị trừ tim khi thiên thạch chạm đáy hoặc bắn sai.
     * Scoreboard: Hiển thị điểm số với hiệu ứng số nhảy và phát sáng neon.
     * Combo Tracker: Hiển thị hệ số combo (Ví dụ: `x2`, `x5`...) phát sáng nhấp nháy khi có chuỗi liên tiếp đúng.
     * Thanh tiến trình (Progress Bar) số lượng câu hỏi hiện tại.
   * **Khu vực câu hỏi trung tâm (Question HUD):**
     * Thiết kế dạng bảng holographic phát sáng.
     * Trong **Listening Mode**: Có thêm nút "Loa phát âm" tự động phát âm bằng Web Speech API (`speechSynthesis`).
     * Trong **Sentence Completion**: Hiển thị câu chứa ô trống `_____`.
   * **Phi thuyền vũ trụ (Spaceship):**
     * Đặt ở chính giữa đáy màn hình.
     * Vẽ bằng SVG tinh xảo, có lửa đuôi (thruster animation) rung giật.
     * Xoay góc (`transform: rotate(...)`) hướng về phía thiên thạch bị bắn dựa trên phép tính toán học lượng giác `Math.atan2(targetY - shipY, targetX - shipX)`.
   * **Thiên thạch (Asteroids):**
     * Danh sách các thiên thạch bay lơ lửng từ trên đỉnh màn hình xuống dưới, hoặc di chuyển ngẫu nhiên hướng xiên về đáy.
     * Mỗi thiên thạch chứa một đáp án dạng text rõ ràng.
     * Khi click chuột vào một thiên thạch:
       * Xác định xem đó là đáp án Đúng hay Sai.
       * Phi thuyền lập tức xoay nòng ngắm về phía tọa độ của thiên thạch đó.
       * Tạo hiệu ứng vẽ tia Laser màu cam/neon từ mũi phi thuyền phóng thẳng tới tâm thiên thạch.
       * Khi tia laser chạm đích: kích hoạt vụ nổ hạt sáng tại tọa độ đó, thiên thạch vỡ vụn và biến mất.
       * Nếu **Đúng**: Điểm tăng, combo tăng, nổ màu vàng/xanh, chuyển câu hỏi tiếp theo và xóa toàn bộ các thiên thạch cũ để spawn đợt mới.
       * Nếu **Sai**: Điểm/Máu giảm, nổ màu đỏ chói, reset combo, thiên thạch bị vỡ và người chơi phải tìm tiếp thiên thạch đúng còn lại.
   * **Va chạm Base (Bottom Collision):**
     * Nếu bất kỳ thiên thạch nào di chuyển vượt quá ranh giới đáy màn hình (chưa bị bắn hạ): Căn cứ bị chấn động (hiệu ứng rung lắc toàn bộ màn hình - screen shake), trừ 1 HP, reset combo, thiên thạch đó tự nổ biến mất.
3. **Game Over / Result Screen (Màn hình kết quả):**
   * Hiện tổng điểm, số combo cao nhất đạt được, thời gian chơi.
   * Danh sách các từ người chơi đã trả lời sai trong lượt chơi để họ ôn tập lại nhanh.
   * Tích hợp lưu trữ:
     * Cập nhật thời gian học thông qua `historyService.incrementStudyStats(userId, "review", timeSpent)`.
     * Cập nhật tiến trình thẻ nhớ SRS qua `srsService.reviewCard(...)` trong thời gian thực (Đúng tăng khoảng cách ôn tập, Sai reset hoặc giảm khoảng cách).
   * Nút bấm: "Chơi lại 🔄", "Trở về bài học 📖".

---

## Technical Details

### Cách sinh thiên thạch và đáp án nhiễu
* Giả sử danh sách từ vựng có $N$ từ. Với mỗi từ chính đang hỏi (Question Word), ta:
  1. Chọn ngẫu nhiên thêm 3 từ khác trong cùng bài học làm đáp án nhiễu (distractors).
  2. Gom đáp án Đúng + 3 đáp án Sai tạo thành mảng 4 lựa chọn. Trộn ngẫu nhiên (shuffle).
  3. Khởi tạo 4 đối tượng `Asteroid` có tọa độ $Y$ âm hoặc ở đỉnh màn hình (ví dụ $Y$ từ $5\%$ đến $20\%$), tọa độ $X$ được chia đều trên chiều rộng màn hình (ví dụ $X \in [10\%, 35\%, 60\%, 85\%]$) để tránh bị chồng đè lên nhau.
  4. Mỗi thiên thạch có vận tốc rơi ngẫu nhiên `vy` tương ứng với độ khó.

### Công thức tính góc xoay phi thuyền
Khi người chơi click vào thiên thạch ở tọa độ $(x_a, y_a)$ và phi thuyền ở tọa độ $(x_s, y_s)$:
$$\theta = \text{Math.atan2}(y_a - y_s, x_a - x_s) \times \frac{180}{\pi} + 90$$
*(Cộng $90^\circ$ vì hướng mặc định của phi thuyền SVG là hướng thẳng đứng lên trên).*

---

## Verification Plan

### Automated Tests
* Chạy build ứng dụng để đảm bảo không có lỗi TypeScript hoặc đóng gói:
  ```bash
  npm run build
  ```

### Manual Verification
1. **Lobby Screen:** Chọn các chế độ chơi và độ khó khác nhau, nhấn Start.
2. **Gameplay Canvas:**
   * Kiểm tra nền sao chuyển động mượt mà.
   * Kiểm tra thiên thạch rơi xuống có chữ đáp án hiển thị đầy đủ, không bị vỡ khung.
   * Kiểm tra phi thuyền xoay chính xác về hướng click.
   * Kiểm tra vẽ tia laser bắn trúng thiên thạch và sinh hạt nổ.
   * Đánh giá hiệu ứng âm thanh (bắn, nổ, combo, va chạm).
   * Kiểm tra va chạm đáy màn hình: giảm HP và rung màn hình.
   * Kiểm tra Listening Mode: nhấn nút loa có phát âm chuẩn.
   * Kiểm tra Sentence Completion: câu hiển thị đúng cấu trúc điền khuyết.
   * Kiểm tra các chế độ học tập (Word → Meaning, Meaning → Word, Listening, Sentence Completion) hoạt động trơn tru.
3. **Database & Stats Sync:**
   * Đăng nhập một tài khoản kiểm thử.
   * Chơi hết một màn game (thắng hoặc hết máu).
   * Kiểm tra xem thời gian chơi game có được cộng vào lịch sử học tập qua Firestore hay không (bằng cách kiểm tra leaderboard hoặc bảng thống kê hoạt động).
   * Kiểm tra trạng thái các thẻ SRS được cập nhật tương ứng (tần suất lặp lại, độ khó).
