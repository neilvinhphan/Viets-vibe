# Nội dung đề xuất cho form giải pháp Gemini

> Nội dung dưới đây được biên soạn dựa trên chức năng đang có trong repository.
> Các lợi ích là kỳ vọng, chưa phải kết quả đo lường; phần lịch sử là nội dung
> tham khảo do ứng dụng cung cấp, không phải kết luận học thuật đã được thẩm
> định.

## I. Thông tin giải pháp

### Tên giải pháp

**Việt Phục AI Stylist — Phối đồ di sản cùng Gemini**

### Nhu cầu người dùng và tình huống sử dụng

Người trẻ quan tâm đến văn hóa Việt thường muốn tìm hiểu và thử phối Việt phục,
nhưng thông tin về tên gọi, lớp mặc, bối cảnh sử dụng và khác biệt giữa các giai
đoạn lịch sử còn phân tán, khó tiếp cận. Người mới tìm hiểu cũng có thể gặp khó
khăn khi hình dung một món đồ sẽ trông ra sao khi kết hợp với trang phục khác.

Giải pháp hướng đến người muốn khám phá Việt phục theo cách trực quan, người
đang chuẩn bị trang phục cho dịp chụp ảnh, tham quan di tích, đi lễ, dự sự kiện
hoặc sáng tạo nội dung. Người dùng có thể chọn bối cảnh, sự kiện, thời tiết và
phong cách; thử các món đồ trên avatar; xem mô tả và nhận gợi ý phối. Khi có ảnh
tham khảo, người dùng có thể tải ảnh lên để Gemini nhận diện các món đồ có thể
quan sát được và gợi ý món tương ứng trong tủ đồ của ứng dụng.

### Tóm tắt giải pháp

Việt Phục AI Stylist là ứng dụng web tương tác kết hợp tủ đồ số, avatar phối
trang phục và trợ lý Gemini. Người dùng có thể phối các lớp trang phục, chọn
outfit mẫu, chuyển giữa cách phối lấy cảm hứng lịch sử và phong cách hiện đại,
đồng thời xem mô tả về cấu trúc, chất liệu, bối cảnh và ý nghĩa được gán cho
từng món đồ.

Ứng dụng hỗ trợ hai luồng AI chính: nhập mô tả phong cách để nhận đề xuất outfit
theo catalog; hoặc tải ảnh trang phục để Gemini phân tích, ước lượng giai đoạn,
nhận diện món đồ và đề xuất ID phù hợp trong tủ đồ. Một bộ quy tắc trong ứng
dụng kiểm tra một số tiêu chí như thứ tự lớp mặc, xung đột niên đại, bối cảnh
và thời tiết. Người dùng có thể xem kết quả, tự điều chỉnh và áp dụng gợi ý lên
avatar. AI và bộ quy tắc đóng vai trò hỗ trợ trải nghiệm, không thay thế chuyên
gia hay nguồn tư liệu lịch sử.

### Tác động kỳ vọng

Giải pháp kỳ vọng giúp việc tiếp cận Việt phục trở nên trực quan và gần gũi hơn,
đặc biệt với người trẻ chưa có nhiều kiến thức nền. Thay vì chỉ đọc mô tả hoặc
xem ảnh tĩnh, người dùng có thể thử kết hợp trang phục, quan sát các lớp mặc và
khám phá cách một outfit thay đổi theo dịp sử dụng.

Các gợi ý theo sự kiện, thời tiết và phong cách có thể giúp người dùng bắt đầu
phối đồ nhanh hơn; chức năng phân tích ảnh có thể tạo cầu nối từ trang phục họ
nhìn thấy ngoài đời tới catalog số. Giải pháp cũng kỳ vọng khuyến khích sự quan
tâm, trao đổi và sáng tạo nội dung về di sản trang phục Việt. Đây là tác động
dự kiến; repository hiện chưa cung cấp số liệu người dùng, nghiên cứu hiệu quả
học tập hoặc đánh giá tác động thực tế.

### Hướng tiếp cận và giải pháp kỹ thuật

Ứng dụng được xây dựng bằng React và TypeScript, dùng Vite cho giao diện và
Express cho API. Catalog trang phục, outfit mẫu, bối cảnh minh họa và luật kiểm
tra được tổ chức trong mã nguồn. Giao diện cung cấp avatar 2D, khu vực phối đồ,
thông tin trang phục và một số mô hình 3D.

Gemini được gọi từ máy chủ thông qua `@google/genai`; khóa API được đọc từ biến
môi trường `GEMINI_API_KEY`, không đặt trong mã phía trình duyệt. Luồng gợi ý
outfit nhận mô tả văn bản, cung cấp cho mô hình danh sách ID trang phục cùng
các lựa chọn bối cảnh/sự kiện/thời tiết, rồi yêu cầu trả về JSON. Luồng phân
tích ảnh gửi ảnh cùng chỉ dẫn phân tích và schema JSON; máy chủ thử
`gemini-3.1-pro-preview`, sau đó dùng `gemini-2.5-flash` nếu lần gọi đầu thất
bại.

Kết quả AI được dùng để hiển thị nhận xét và gợi ý ID catalog; bộ kiểm tra outfit
của ứng dụng là một lớp quy tắc riêng. Dự án có khai báo schema PostgreSQL và
các endpoint phục vụ schema, nhưng hiện không triển khai kết nối cơ sở dữ liệu
để lưu catalog hoặc lịch sử người dùng. Dữ liệu văn hóa và kết quả AI cần được
đối chiếu với nguồn đáng tin cậy trước khi dùng cho mục đích giáo dục hoặc
nghiên cứu.

## II. Ứng dụng Gemini & Prompting

### Cách sử dụng Gemini

Gemini được dùng ở hai chức năng:

1. **Gợi ý outfit từ mô tả:** người dùng nhập mong muốn như đi lễ, đi concert,
   chụp kỷ yếu hoặc dạo phố. Máy chủ ghép yêu cầu với danh sách món đồ hiện có,
   các ID bối cảnh/sự kiện/thời tiết được hỗ trợ và một số ràng buộc văn hóa,
   rồi gọi `gemini-2.5-flash` để yêu cầu kết quả JSON gồm `garmentIds`,
   `sceneId`, `eventType`, `weatherType` và `stylingAdvice`. Khi không cấu hình
   API key hoặc lời gọi/phân tích phản hồi AI phát sinh lỗi, endpoint dùng gợi ý
   theo từ khóa làm phương án dự phòng.
2. **Phân tích ảnh trang phục:** người dùng tải ảnh lên; máy chủ gửi ảnh và
   hướng dẫn phân tích tới `gemini-3.1-pro-preview`, yêu cầu JSON theo schema
   gồm nhận xét triều đại, mức độ trang trọng, quan sát văn hóa, các món đồ
   nhận diện được, độ tin cậy và ID gợi ý trong tủ đồ. Nếu model chính lỗi,
   máy chủ thử lại với `gemini-2.5-flash`.

Gemini cung cấp nhận diện và gợi ý có tính xác suất. Nhận định về niên đại,
phẩm cấp, tính xác thực và biểu tượng văn hóa có thể sai hoặc thiếu ngữ cảnh;
người dùng nên xem chúng như gợi ý ban đầu, không phải kết luận giám định.
Ảnh tải lên được gửi từ máy chủ tới dịch vụ Gemini để phân tích; không tải lên
ảnh riêng tư hoặc nhạy cảm nếu chưa cân nhắc chính sách dữ liệu áp dụng.

### Chiến lược và quy trình prompting

Prompt được thiết kế để giới hạn câu trả lời trong phạm vi ứng dụng thay vì yêu
cầu AI tự tạo một outfit bất kỳ:

1. Xác định nhiệm vụ và ngữ cảnh từ yêu cầu người dùng hoặc ảnh đầu vào.
2. Cung cấp danh sách ID trang phục và tập lựa chọn hợp lệ để kết quả có thể
   liên kết với catalog hiện có.
3. Nêu ràng buộc theo bối cảnh, chẳng hạn tránh món đồ không phù hợp ở nơi tôn
   nghiêm; yêu cầu ảnh trả về các trường theo JSON schema.
4. Hiển thị gợi ý để người dùng xem và chỉnh sửa; việc áp dụng outfit vẫn do
   người dùng quyết định.
5. Nếu AI không khả dụng, dùng phương án gợi ý theo từ khóa ở luồng outfit.
   Kết quả AI và kết quả kiểm tra theo luật được xem là hai lớp hỗ trợ khác nhau.

Mẫu prompt gợi ý outfit:

```text
Bạn là trợ lý phối Việt phục cho người mới tìm hiểu văn hóa Việt.
Hãy gợi ý một outfit cho nhu cầu: "Mình đi tham quan Văn Miếu vào ngày nắng,
muốn mặc lịch sự nhưng trẻ trung".
Chỉ chọn ID từ danh sách trang phục được cung cấp.
Chọn bối cảnh, sự kiện và thời tiết trong danh sách giá trị hợp lệ.
Không chọn trang phục ngắn hoặc thiếu trang nghiêm cho nơi thờ tự/di tích.
Trả về JSON đúng schema; phần tư vấn ngắn gọn, nêu rõ đây là gợi ý tham khảo,
không khẳng định tính xác thực lịch sử nếu không có căn cứ cụ thể.
```

Mẫu prompt phân tích ảnh:

```text
Quan sát ảnh và chỉ mô tả những chi tiết có thể nhìn thấy.
Liệt kê tên các món đồ, dấu hiệu nhận diện và mức độ tin cậy cho từng nhận định.
Ước lượng giai đoạn lịch sử nếu có căn cứ; nếu ảnh không đủ thông tin,
hãy ghi rõ chưa thể xác định thay vì suy đoán chắc chắn.
Phân biệt quan sát trực tiếp với suy luận về niên đại, phẩm cấp hoặc ý nghĩa.
Chỉ đề xuất ID có trong catalog được cung cấp và trả lời theo JSON schema.
```

Hai đoạn trên là **mẫu prompt đề xuất để mô tả/định hướng cách dùng**; prompt
đang chạy trong mã có thể khác và chưa bao gồm đầy đủ mọi yêu cầu thận trọng
trong ví dụ. Có thể cải thiện tiếp bằng cách thêm kiểm tra enum và ID ở máy chủ,
ghi nguồn cho từng nhận định, yêu cầu model nêu bất định, rồi đánh giá thủ công
các trường hợp AI nhận diện sai trước khi mở rộng phạm vi sử dụng.

## Chạy dự án

Yêu cầu Node.js và npm:

```bash
npm install
npm run dev
```

Ứng dụng chạy tại `http://localhost:3000`.

### Biến môi trường

Tạo file `.env` dựa trên `.env.example` khi cần dùng Gemini:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

Không commit API key hoặc file `.env` lên Git.

### Lệnh thường dùng

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy máy chủ phát triển |
| `npm run build` | Build giao diện và bundle máy chủ |
| `npm start` | Chạy máy chủ đã build |
| `npm run preview` | Mở bản preview Vite |
| `npm run lint` | Kiểm tra TypeScript |

### Cấu trúc chính

- `src/data/garments.ts`: catalog trang phục, outfit mẫu và ánh xạ bộ sưu tập.
- `src/data/historicalScenes.tsx`: dữ liệu và hình minh họa bối cảnh.
- `src/services/culturalValidationEngine.ts`: bộ quy tắc kiểm tra outfit.
- `src/components/`: giao diện phối đồ, phân tích ảnh và thông tin trang phục.
- `server.ts`: API và tích hợp Gemini.
- `src/data/postgresSchema.ts`: schema PostgreSQL được cung cấp qua API.

## Phạm vi và giới hạn

Catalog và bộ kiểm tra hiện phục vụ trải nghiệm minh họa. Danh mục tài liệu
tham khảo chưa gắn số trang, chương hoặc hiện vật cụ thể cho từng nhận định;
không nên xem mô tả, điểm số hoặc phân tích AI là xác nhận lịch sử. Schema
PostgreSQL có trong dự án nhưng chưa đồng nghĩa với việc ứng dụng đã kết nối
database. Trước khi dùng như công cụ giáo dục chính thức, cần rà soát nội dung
với chuyên gia, bổ sung nguồn kiểm chứng và kiểm thử độ chính xác của các luồng
AI.

## Giấy phép

Repository hiện chưa khai báo giấy phép.
