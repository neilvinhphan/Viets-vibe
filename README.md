# 🇻🇳 Việt Vibe (Chạm Khai Mở)

> **Tương tác số hóa Di sản Cổ phục Việt Nam với công nghệ Generative AI.**
> Dự án tham gia [Tên cuộc thi / Audition]. 

[![Live Demo](https://img.shields.io/badge/Live-Demo-2ea44f?style=for-the-badge)](https://viets-vibe-gkyy.vercel.app/)
[![Video Intro](https://img.shields.io/badge/Video-Intro-e11d48?style=for-the-badge)](Link-video-Youtube-cua-ban)

Việt Vibe không chỉ là một ứng dụng web, mà là một "Bảo tàng Đương đại kết hợp Xưởng Chế tác", giúp người dùng trẻ khám phá, học hỏi và sáng tạo (remix) cổ phục Việt Nam thông qua không gian 2D, 3D và sự hỗ trợ của Gemini AI.

---

## ✨ Tính năng nổi bật (Features)

*   **👗 Giao diện Phối đồ 2D (Layering Studio):** Cho phép người dùng thử các lớp trang phục, từ cổ điển đến hiện đại (Gen Z style).
*   **🏛️ Không gian Hành lang 3D:** Khám phá phom dáng trang phục dưới góc nhìn 360 độ trực quan.
*   **🤖 Phòng thử đồ AI (Beta):** Tích hợp `gemini-2.5-flash` để phân tích hình ảnh tham khảo hoặc camera thực tế, từ đó gợi ý/nhận diện các món đồ phù hợp trong catalog.
*   **⚖️ AI Linter & Cultural Validation Engine:** Tự động kiểm tra tính chính xác về mặt văn hóa, niên đại và hiển thị cảnh báo (A/B testing) khi người dùng kết hợp trang phục có thể gây sai lệch lịch sử.
*   **📖 Lookbook Cá nhân:** Lưu trữ và quản lý bộ sưu tập các bản phối, bóc tách tone màu chủ đạo.

---

## 🛠️ Ngăn xếp Kỹ thuật (Tech Stack)

*   **Frontend:** React 19, TypeScript, Vite, TailwindCSS (v4), Framer Motion.
*   **Backend / API:** Express.js, Node.js.
*   **AI Integration:** `@google/genai` (Google Gemini Models).
*   **Deployment:** Vercel / Render.

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án (Local Development)

### 1. Yêu cầu hệ thống
*   [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản 20+ hoặc 22+)
*   Trình quản lý gói: `npm` hoặc `bun`

### 2. Cài đặt

Clone repository và cài đặt dependencies:

```bash
git clone https://github.com/neilvinhphan/Viets-vibe.git
cd Viets-vibe
npm install
```

### 3. Cấu hình Biến môi trường (Environment Variables)

Tạo file `.env` ở thư mục gốc (root) bằng cách sao chép từ file mẫu:

```bash
cp .env.example .env
```

Mở file `.env` và thêm API Key Gemini của bạn:

```dotenv
GEMINI_API_KEY=your_gemini_api_key_here
APP_URL=http://localhost:3000
```
*(Lưu ý: Không bao giờ commit file `.env` lên GitHub).*

### 4. Chạy máy chủ (Start Server)

Chạy môi trường phát triển (Development):

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### 5. Các câu lệnh (Scripts) khác

*   `npm run build`: Đóng gói (build) giao diện Vite và bundle máy chủ Express.
*   `npm start`: Khởi chạy máy chủ sau khi đã build (Production mode).
*   `npm run lint`: Kiểm tra lỗi code với TypeScript.

---

## 📂 Kiến trúc Thư mục chính (Project Structure)

```text
Viets-vibe/
├── src/
│   ├── components/      # Các UI Components (Phối đồ, Camera AI, 3D Modal...)
│   ├── data/
│   │   ├── garments.ts  # Catalog dữ liệu trang phục và outfit mẫu
│   │   └── postgresSchema.ts # Schema PostgreSQL 
│   ├── services/
│   │   └── culturalValidationEngine.ts # Logic kiểm tra tính hợp lệ văn hóa
│   ├── hooks/           # Các Custom React Hooks
│   └── main.tsx         # Entry point React
├── public/              # Chứa assets tĩnh (Logo, Favicon, Models 3D...)
├── server.ts            # Máy chủ Express & Logic tích hợp Gemini API
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## ⚠️ Giới hạn & Tuyên bố miễn trừ trách nhiệm (Disclaimer)

Dự án hiện đang trong giai đoạn phát triển (Prototype/Beta).
*   Các thông tin văn hóa, nhận định lịch sử và điểm số AI Linter hiện phục vụ mục đích minh họa và trải nghiệm, **không thay thế kết luận giám định chuyên môn của các nhà nghiên cứu lịch sử.**
*   Tính năng AI Camera (Phòng thử đồ) có thể nhận diện sai sót do phụ thuộc vào góc chụp, ánh sáng và khả năng suy luận xác suất của mô hình LLM.

---
*Thiết kế và phát triển bởi Gen Z Studio với ❤️ và niềm tự hào Văn hóa Việt Nam.*
