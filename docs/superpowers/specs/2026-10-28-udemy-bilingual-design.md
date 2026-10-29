# CC Udemy — bản đầu miễn phí

## Nhu cầu đã thống nhất

Extension dành cho việc học khóa tiếng Anh trên Udemy, lấy cảm hứng từ Language Reactor. Người dùng muốn hiện phụ đề Anh–Việt đồng thời và bấm từ tiếng Anh để tra nghĩa tiếng Việt. Làm bản miễn phí trước; tích hợp dịch AI có API key sau.

## Các lựa chọn đề xuất

- Nền tảng: Chrome trên máy tính, Manifest V3, Chrome 138 trở lên. Đây là lựa chọn của người triển khai, chưa phải yêu cầu riêng của người dùng.
- Không cần tài khoản riêng, máy chủ hay API key.
- Nếu bài giảng có phụ đề Anh và Việt, dùng hai bản sẵn có. Nếu chỉ có bản Anh, dùng Translator API tích hợp trong Chrome để dịch sang Việt.
- Bộ dịch này chạy trên thiết bị, cần tải bộ ngôn ngữ lần đầu. Đây là bộ dịch miễn phí của trình duyệt; phần AI qua nhà cung cấp ngoài/API key được để sau.
- Chỉ dịch phụ đề văn bản; không xử lý âm thanh hay tải video.
- Bản đầu tập trung trang học khóa trên `www.udemy.com`. Udemy Business chưa được cam kết trước khi có trang thực tế để kiểm tra.

## Trải nghiệm xem bài

Extension đặt một lớp phụ đề ở vùng dưới video, phía trên thanh điều khiển: dòng Anh ở trên, dòng Việt bên dưới. Chữ rõ, nền tối vừa đủ đọc và không chiếm thêm một bảng cạnh video. Giao diện tiếng Việt.

Phụ đề bám thời gian video, cập nhật khi tua và khi chuyển bài. Chỉ hiện câu đang phát; không giữ bản dịch câu cũ khi câu mới chưa dịch xong. Ưu tiên dịch trước một số câu sắp phát và lưu kết quả trên máy để giảm thời gian đợi. Kết quả bất đồng bộ của bài cũ không được ghi đè bài mới.

Các từ trong dòng Anh có thể bấm bằng chuột hoặc chọn bằng bàn phím. Khi bấm, video tạm dừng và một ô nhỏ hiện từ gốc cùng nghĩa tiếng Việt. Bản đầu là dịch nghĩa của từ đơn, chưa phải từ điển có phiên âm, từ loại hay nghĩa theo ngữ cảnh. Đóng ô tra từ trả lại trạng thái phát trước đó: chỉ phát tiếp nếu extension đã tạm dừng video; video vốn đang dừng thì tiếp tục dừng. Escape đóng ô và trả focus về từ vừa chọn.

Có nút bật/tắt extension và chỉnh cỡ chữ, lưu trên máy. Lớp giao diện nằm trong vùng player để có thể hoạt động ở chế độ toàn màn hình của trang; cần kiểm tra thực tế vì cấu trúc player có thể thay đổi. Khi bật, tránh hiện trùng phụ đề gốc; khi tắt, trả phụ đề gốc về trạng thái trước đó.

## Lần đầu và trạng thái lỗi

- Bộ dịch cần tải: hiện nút “Bật dịch miễn phí” để thao tác người dùng khởi tạo Translator, kèm tiến độ nếu trình duyệt cung cấp.
- Không có phụ đề Anh: thông báo cần bật hoặc chọn phụ đề tiếng Anh trong Udemy. Không tự nhận diện giọng nói.
- Chrome không có Translator hoặc không cho dùng cặp Anh–Việt: vẫn dùng phụ đề Việt có sẵn nếu có; giải thích rõ khi không thể tự dịch.
- Lỗi tải bộ ngôn ngữ hoặc dịch: giữ dòng Anh, báo trạng thái ngắn và cho thử lại. Không âm thầm gọi dịch vụ bên ngoài.
- Không có nghĩa từ: báo không tra được, không thay bằng nghĩa giả hoặc dữ liệu mẫu.

## Cấu trúc kỹ thuật đề xuất

JavaScript thuần, HTML/CSS, không framework hay bước build bắt buộc. Thư mục extension có thể được chọn trực tiếp bằng Load unpacked.

- `manifest.json`: phạm vi Udemy, khai báo content scripts và quyền lưu cài đặt cục bộ.
- `src/captions.js`: đọc cue, chuẩn hóa văn bản và tìm cue theo thời gian; độc lập với DOM để kiểm thử.
- `src/udemy-adapter.js`: tìm player và phụ đề qua text tracks/DOM; theo dõi đổi video và đổi bài. Nếu player thực tế không cung cấp các nguồn này, điều chỉnh adapter dựa trên bằng chứng từ trình duyệt trước khi khẳng định tương thích.
- `src/translator.js`: một giao diện `translate(text)` cho phụ đề và từ; hiện thực đầu tiên dùng Translator trong document, không dùng service worker vì API không chạy trong worker. Chuẩn bị điểm thay provider cho AI sau, không xây cấu hình AI ở bản đầu.
- `src/content.js` và `src/overlay.css`: điều phối video, giao diện, trạng thái dịch, tra từ và cài đặt; cách ly CSS với trang.
- `tests/`: kiểm thử cue, đồng bộ bất đồng bộ, trạng thái phát/dừng và thay bài.
- `README.md`: cài đặt, bật phụ đề, tải bộ ngôn ngữ, giới hạn và cách kiểm tra trên Udemy.

Không tin dữ liệu lấy từ trang: dựng nội dung bằng text nodes, không chèn HTML từ phụ đề. Không thu thập cookie, tài khoản hoặc lịch sử học; không gửi nội dung khóa học ra dịch vụ dịch ngoài.

## Điều kiện nghiệm thu

1. Với bài có phụ đề Anh, hiển thị Anh và Việt đồng thời, đúng đoạn đang xem.
2. Tua video, chuyển bài và bật/tắt không tạo lớp phụ đề trùng hoặc giữ câu cũ.
3. Bấm từ hiện nghĩa Việt; phát/dừng khi mở và đóng ô đúng trạng thái trước đó.
4. Chuột, bàn phím và toàn màn hình không làm ô tra từ mất khả năng sử dụng.
5. Bộ dịch không sẵn sàng hoặc không có phụ đề có thông báo đúng, không giả vờ dịch thành công.
6. Cài bằng Load unpacked, không cần key hay build.
7. Kiểm thử tự động phần logic và kiểm tra giao diện bằng trình duyệt. Kiểm chứng trên Udemy đăng nhập được ghi riêng; kiểm tra bằng trang mô phỏng không đủ để tuyên bố chạy trên Udemy thật.

## Ngoài phạm vi bản đầu

Dịch AI qua API, nhận diện giọng nói, lưu bộ từ vựng, flashcards, luyện phát âm, phát âm từ, xuất phụ đề và hỗ trợ các nền tảng ngoài Udemy.

## Bằng chứng kỹ thuật và điều chưa biết

- Thư mục dự án ban đầu trống, chưa có code hay ràng buộc nền tảng để kế thừa.
- [Udemy: phụ đề](https://support.udemy.com/hc/en-us/articles/229232287-Finding-Courses-With-Subtitles): ngôn ngữ phụ đề phụ thuộc khóa học.
- [Chrome: Translator API](https://developer.chrome.com/docs/ai/translator-api): Chrome desktop, hỗ trợ `vi`, kiểm tra khả dụng theo cặp ngôn ngữ, khởi tạo từ thao tác người dùng, tải model lần đầu và không hoạt động trong Web Workers.
- [Chrome: content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts): script cách ly JavaScript với trang nhưng chia sẻ DOM.
- Endpoint Google Translate miễn phí thử từ môi trường phát triển trả HTTP 429 vào 2026-10-28; không chọn làm phụ thuộc mặc định.
- Chưa kiểm tra cấu trúc player Udemy đang đăng nhập, khả năng đọc cả hai track, khả dụng Translator trong extension/content script và toàn màn hình. Cần một bước kiểm chứng tích hợp sớm, không khẳng định đã chạy.

## Rà soát trước triển khai

Lượt builder-check độc lập không tìm thấy câu hỏi quan trọng cần người dùng trả lời thêm. Bước đầu của kế hoạch phải kiểm chứng tích hợp: đọc được cue tiếng Anh từ player, gọi Translator trong document của extension và giữ giao diện khi toàn màn hình. Chỉ chốt adapter sau khi có bằng chứng này. Nếu không có quyền truy cập Udemy đăng nhập, ghi rõ giới hạn và không dùng trang mô phỏng để kết luận tương thích.

## Trạng thái

Người dùng đã duyệt thiết kế và yêu cầu triển khai (“oke làm đi em”). Đã có bản đầu trong workspace; xem README và progress để phân biệt kiểm thử mô phỏng, tải manifest và trạng thái bộ dịch thật.
