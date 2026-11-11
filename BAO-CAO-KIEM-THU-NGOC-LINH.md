# Báo cáo kiểm thử giọng Ngọc Linh

Ngày hoàn tất kiểm thử kỹ thuật: 2026-11-12 (giờ Việt Nam).

- Bản game: commit 6f5c6f2c33806f45c80c02f0f1a512f7c37390d6.
- Giọng: Ngọc Linh, preset tiếng Việt nữ miền Bắc của Onter Voice AI. Tạo và tải MP3 từ trang VoiceAI.
- Tệp: 45/45 MP3 đọc được bằng ffprobe, đủ mục trong manifest. GitHub Pages trả HTTP 200 và SHA-256 khớp cho cả 45 tệp.
- Offline: Chrome và Edge đều hoàn thành 30 lượt trên 3 cấp độ với mạng tắt. ZIP qua kiểm tra toàn vẹn, đủ 45 MP3 khớp từng byte và ghi đúng commit bản game.
- Online: Chrome hoàn thành lại 30 lượt trên URL GitHub Pages. Kiểm thử gồm lời chào và hướng dẫn tuần tự, câu hỏi, chạm ngôi sao để đọc số, tắt và bật tiếng, nghe lại, ghép đôi, đáp án sai, kéo thả, chuyển cấp, chơi lại và toàn màn hình.
- Mã chạy dùng một luồng phát lời tại một thời điểm, dừng clip cũ khi có lời mới hoặc chuyển màn. Các MP3 giọng cũ đã được gỡ khỏi bản phát hành.
- Chưa nghiệm thu bằng tai nghe về cách phát âm, nhịp và độ tự nhiên. Trình duyệt xác nhận tệp phát được, không đánh giá được chất lượng giọng.
- Gói offline trên Drive: https://drive.google.com/file/d/1ns70fAHv0ClhjH8g3oxmPdvh2AwPXu84/view
- SHA-256 của ZIP: 67EF3CE32A76361873EFF7D89E0A66B49DFA42D16D87D5EC82C96B4AC3113835

Tái tạo gói từ commit bản game bằng git archive --format=zip --prefix=Giai-cuu-ngoi-sao-so/ --output=Giai-cuu-ngoi-sao-so-Ngoc-Linh-offline.zip 6f5c6f2. Kiểm tra tệp bằng node verify-voice.cjs, luồng chơi bằng node test-game-voice.cjs. Gói phát hành và báo cáo là bản bàn giao. Xem lại các tệp kiểm thử phụ sau 14 ngày.
