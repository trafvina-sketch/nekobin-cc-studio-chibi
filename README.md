# 🐾 NekoBIN & CC Studio Chibi v4.0 (Cloud Pro Edition)

Ứng dụng Web hiện đại phong cách **Kawaii Anime / Chibi Game UI** hỗ trợ tra cứu **BIN/IIN 6–8 chữ số** theo chuẩn **ISO/IEC 7812:2017**, giải phẫu thuật toán **Luhn Mod-10** từng bước, so sánh 2 đầu BIN, cố vấn chính sách vùng **AVS / 3DS2**, và bộ công cụ kiểm thử **QA Sandbox** chuẩn PCI-DSS.

## ✨ Tính năng nổi bật (v4.0)
- **🔍 Soi BIN 6–8 Số & Lật Thẻ 3D Hologram**: Hỗ trợ cả BIN 6 số truyền thống và 8 số mở rộng (Sub-allocation), lật mặt trước/sau thẻ 3D, tự động định dạng `4-6-5` cho Amex 15 số và lưu lịch sử tra cứu gần đây.
- **🧬 Giải Phẫu 4 Khối ISO/IEC 7812 & Luhn Từng Bước**: Hiển thị trực quan MII, IIN/BIN, Account ID, Check Digit kèm nút **🪄 Tự điền / Sửa số cuối Luhn**.
- **⚡ Bulk Check Đa Luồng 6x + Batch API + Lọc Văn Bản Hỗn Hợp**: Tự động gom nhóm BIN để gọi Cloud API 1 lần, chạy song song 6 luồng kèm thanh tiến trình thực tế, nút Dừng và bộ lọc thông minh từ văn bản lộn xộn.
- **🪄 Xưởng Đúc Thẻ CSPRNG (Không Trùng Lặp)**: Hỗ trợ độ dài `15 / 16 / 19` số, thuật toán ngẫu nhiên mật mã học CSPRNG và xuất ra `PIPE`, `SLASH`, `CSV`, `JSON`, `SQL INSERT`.
- **🆚 Bàn Cân So Sánh 2 Đầu BIN & Kho Thẻ QA Sandbox**: Đặt 2 mã BIN cạnh nhau để phát hiện lệch quốc gia/AVS/Prepaid và cung cấp bộ thẻ test chuẩn quốc tế (Approved, 3DS2 Challenge, Insufficient Funds, Expired, CVC Fail).
- **🌸 2 Giao Diện Chibi (Sakura Milk & Starry Night) + 🔊 Web Audio SFX**: Tích hợp Mascot Thám tử mèo Neko-chan tương tác biểu cảm trực tiếp.

## 🚀 Chạy tại máy cá nhân (Zero Dependencies)
```bash
npm start
# Mở trình duyệt tại http://localhost:3000
```

## 🧪 Chạy bộ kiểm thử tự động
```bash
npm test
```

## ☁️ Triển khai lên Vercel
Dự án được thiết kế sẵn cấu trúc Serverless (`api/check-bin.js`, `api/check-card-status.js`, `api/health.js`) tương thích 100% với **Vercel** mà không cần cấu hình phức tạp.

## 👑 Thông tin Quản trị viên (Admin)
- **Admin**: Đường Thọ
- **Zalo**: [0934415387](https://zalo.me/0934415387)
- **Telegram**: [@dongtho8888](https://t.me/dongtho8888)
