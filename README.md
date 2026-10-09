# Viet Phuc Mix & Match

Ứng dụng web tương tác để phối lớp Việt phục, xem thông tin trang phục và thử
các bản phối lấy cảm hứng từ nhiều giai đoạn lịch sử Việt Nam. Dự án kết hợp
catalog trang phục, một số bối cảnh di tích minh họa, chế độ phối hiện đại và
kiểm tra tính nhất quán theo bộ quy tắc mô phỏng.

## Tính năng

- Phối trang phục trên avatar 2D và xem một số bộ sưu tập 3D.
- Lọc, tìm kiếm trang phục và xem mô tả cấu trúc, bối cảnh, chất liệu, ý nghĩa
  biểu tượng cùng danh mục tài liệu tham khảo.
- Chọn bối cảnh, sự kiện và thời tiết để nhận gợi ý phối đồ.
- Kiểm tra thứ tự lớp mặc, sự tương thích niên đại và một số tiêu chí bối cảnh.
- Tạo gợi ý phối đồ theo yêu cầu; có thể dùng Gemini khi cấu hình API key.
- Cung cấp API cho catalog, kiểm tra outfit và schema PostgreSQL.

## Chạy cục bộ

Yêu cầu Node.js và npm.

```bash
npm install
npm run dev
```

Ứng dụng chạy ở `http://localhost:3000`.

### Biến môi trường

Sao chép `.env.example` thành `.env` nếu cần cấu hình tích hợp:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

`GEMINI_API_KEY` chỉ cần thiết cho gợi ý outfit qua Gemini và phân tích ảnh bằng
AI. Một số chức năng có thể chạy theo luật gợi ý có sẵn khi không cấu hình key.
Không commit file `.env` hoặc API key vào Git.

## Lệnh

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy máy chủ phát triển |
| `npm run build` | Build frontend và bundle máy chủ |
| `npm start` | Chạy máy chủ đã build |
| `npm run preview` | Mở bản preview Vite |
| `npm run lint` | Kiểm tra kiểu TypeScript |

## Cấu trúc chính

- `src/data/garments.ts`: catalog trang phục, outfit mẫu và ánh xạ bộ sưu tập.
- `src/data/historicalScenes.tsx`: dữ liệu và hình minh họa bối cảnh.
- `src/services/culturalValidationEngine.ts`: các quy tắc kiểm tra outfit.
- `src/components/`: giao diện phối đồ, thông tin lịch sử và kiểm tra outfit.
- `server.ts`: API và tích hợp Gemini.
- `src/data/postgresSchema.ts`: schema PostgreSQL được cung cấp qua API.

## Lưu ý về nội dung lịch sử

Catalog và bộ kiểm tra là nội dung minh họa cho trải nghiệm phối đồ, không phải
cơ sở dữ liệu học thuật hay kết luận xác thực niên đại. Các trường “bối cảnh”,
“biểu tượng” và “tài liệu tham khảo” hiện chưa có trích dẫn đến số trang, chương
hoặc hiện vật cho từng nhận định; vì vậy các kết quả kiểm tra chỉ phản ánh quy
tắc mô phỏng trong ứng dụng, không thay thế việc đối chiếu tư liệu hoặc ý kiến
chuyên gia về cổ phục. Khi bổ sung nội dung, nên ghi rõ giai đoạn/địa phương,
phân biệt chứng cứ với diễn giải, và dẫn nguồn đủ chi tiết để kiểm chứng.

## Giấy phép

Chưa có thông tin giấy phép được khai báo trong repository.
