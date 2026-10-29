# LectureSub for Udemy — Song ngữ & Từ vựng · v0.3.0

Extension Chrome hiện phụ đề song ngữ, tra từ và lưu từ vựng ngay trong video bài giảng Udemy. Miễn phí, không cần API key hoặc tài khoản riêng.

## Cập nhật từ bản cũ

Nếu đã cài extension bằng Load unpacked, giữ nguyên thư mục đã chọn và bấm **Reload / Tải lại** trên thẻ LectureSub ở `chrome://extensions`, rồi tải lại tab Udemy. Không cần gỡ cài đặt. Cài đặt cũ và cache Anh–Việt được tự động chuyển sang bản mới; gỡ cài đặt sẽ xóa dữ liệu cục bộ.

## Cài lần đầu

1. Mở `chrome://extensions` trong Chrome máy tính 138 trở lên.
2. Bật **Developer mode / Chế độ dành cho nhà phát triển**.
3. Chọn **Load unpacked / Tải tiện ích đã giải nén**, chọn thư mục có `manifest.json`. Với ZIP, giải nén rồi chọn thư mục `lecturesub-for-udemy` (hoặc `cc-udemy`).
4. Tải lại tab bài giảng Udemy.
5. Chọn ngôn ngữ nguồn trong menu **CC / Phụ đề của Udemy**, đồng thời chọn cùng ngôn ngữ nguồn trong LectureSub.
6. Bấm **Bật dịch miễn phí** trên video. Lần đầu Chrome cần tải bộ ngôn ngữ; giữ tab mở và chờ tải xong.

Không cần `npm install` hay build để sử dụng.

## Reading Room · 0.3.0

Giao diện theo concept Reading Room đã duyệt: nền giấy sáng, chữ đen, nhấn xanh chanh. Ngôn ngữ và chế độ hiển thị luôn nằm bên trái; ba nhóm Kiểu chữ / Bố cục / Tra từ ở bên dưới. Vùng xem trước bên phải lớn hơn, có bài học minh họa và ô nghĩa từ. Các giá trị cấu hình đã lưu được giữ nguyên.

Phần xem trước là **ví dụ Anh–Việt**, không phải video hay bản dịch thật từ Udemy. Có thể phát/tua đoạn ví dụ 12 giây để xem phụ đề đổi câu, bấm từ tô sáng để xem nghĩa mẫu và tự chọn Lưu từ mẫu. Từ mẫu chỉ được thêm vào sổ khi bấm lưu. Ảnh nền được tạo riêng, đóng gói cục bộ; văn bản/sơ đồ/điều khiển được dựng bằng HTML/SVG.

Popup, các lựa chọn dạng nút và ô tra từ trên video dùng cùng giao diện. Từ được chọn trên video được đánh dấu, ô nghĩa bám gần vị trí từ. Không thêm phát âm hay tra từ khi rê chuột trong đợt này.

## Tính năng và cấu hình

- Chọn ngôn ngữ nguồn/đích; mặc định Anh → Việt. Kiểm tra hỗ trợ theo từng cặp trên máy, không mặc định mọi cặp đều dùng được.
- Song ngữ, chỉ bản gốc hoặc chỉ bản dịch; đảo thứ tự hai bản.
- Cỡ chữ và màu riêng; kiểu chữ hệ thống/có chân/đơn cách, độ đậm, màu/độ đậm nền, giãn dòng, khoảng cách hai bản, chiều rộng, căn chữ và khoảng cách tới đáy player.
- Trang **Mở cài đặt** có xem trước và tự lưu. Các tab Udemy đang mở cập nhật theo. Khôi phục mặc định chỉ reset cấu hình, giữ từ vựng.
- Bấm từ trong bản gốc để tra nghĩa. Có thể bật/tắt tự tạm dừng và tự phát tiếp khi đóng; video vốn đang dừng sẽ không tự phát.
- Lưu từ kèm nghĩa, cặp ngôn ngữ, câu gốc, bài học và thời điểm. Sổ từ tìm được cả từ/ nghĩa/ câu gốc, hỗ trợ tìm không dấu, xóa từng từ và hoàn tác lần xóa gần nhất trong trang đang mở.
- Xuất CSV theo kết quả đang lọc. Dữ liệu bắt đầu bằng ký tự công thức được giữ dạng văn bản để mở trong ứng dụng bảng tính.
- Phím **Alt + Shift + C** bật/tắt phụ đề, không chạy khi đang nhập liệu; có thể tắt phím này trong cài đặt. **Esc** đóng ô tra từ.
- Hỗ trợ bàn phím, player hẹp và fullscreen chứa player. Khung nhỏ tự giảm chữ khi cần; với câu đặc biệt dài, từng dòng có thể cuộn.

Mở cài đặt bằng nút bánh răng trên video, qua popup extension, hoặc chuột phải biểu tượng extension → Options. Popup chứa chọn ngôn ngữ/chế độ/bật tắt nhanh và lối vào sổ từ.

## Ngôn ngữ và giới hạn

Dùng [Translator API tích hợp Chrome](https://developer.chrome.com/docs/ai/translator-api), không gọi các endpoint dịch miễn phí không chính thức. Khả dụng phụ thuộc cặp ngôn ngữ, chính sách Chrome và việc tải model; Chrome 138+ chưa đảm bảo mọi máy dùng được mọi cặp.

Player có native text tracks: dùng phụ đề dịch sẵn có nếu khớp cặp ngôn ngữ. Player chỉ có phụ đề DOM (đã quan sát trên Udemy): đọc và dịch câu đang hiện, nên **đổi ngôn ngữ nguồn trong extension chưa tự đổi menu CC của Udemy**. Chọn cùng ngôn ngữ trong cả hai nơi. Không tự nhận diện giọng nói, không tạo phụ đề khi bài không có phụ đề nguồn. Với DOM cue, lần dịch đầu có thể trễ; bản dịch cũ bị bỏ qua khi chuyển câu/bài/cặp ngôn ngữ.

Tra nghĩa là dịch từ đơn, chưa có phiên âm, từ loại, ví dụ hay bảo đảm nghĩa đúng theo toàn bộ ngữ cảnh. Tiếng Nhật/Trung/Thái dùng bộ tách từ của trình duyệt. Dịch AI qua API và lặp câu chính xác để sau.

Chỉ hỗ trợ `www.udemy.com` trên Chrome máy tính; Udemy Business, di động và Picture-in-Picture chưa nằm trong bản này. HTML overlay không xuất hiện khi trình duyệt fullscreen riêng phần tử video thay vì container player.

## Dữ liệu và quyền

Chỉ xin quyền `storage`; content scripts chạy trên `https://www.udemy.com/*`. Không thu thập tài khoản/cookie, không tải video, không analytics và không gửi văn bản sang dịch vụ dịch bên ngoài. Chrome có thể tải bộ ngôn ngữ từ nhà cung cấp.

Cài đặt, tối đa 500 bản dịch và sổ từ tối đa 2.000 mục được lưu cục bộ. Dữ liệu không đồng bộ sang máy khác. Các bản dịch cache được tách theo cặp ngôn ngữ; dữ liệu cũ chỉ được nhập vào cặp Anh–Việt. Ghi cấu hình/từ vựng qua một hàng đợi của extension để nhiều tab không ghi đè thay đổi của nhau.

## Phát triển và kiểm thử

```sh
npm test
npm install
npx playwright install chromium
npm run test:browser
npm run package
```

Node.js 20+. Browser tests dùng Chrome cài sẵn và Chrome for Testing trong **profile tạm riêng**, không đọc profile người dùng. Runtime không có dependency ngoài; Playwright chỉ phục vụ kiểm thử.

`npm run package` tạo `dist/cc-udemy/` cho Load unpacked và `dist/cc-udemy-0.3.0.zip`. Kiểm thử bao gồm unit logic, UI player bằng fixture, trang options/popup thật của extension, đồng bộ cấu hình qua tab, CSV và playback bằng video stream kiểm thử có thể phát/dừng. Ảnh nằm ở `test-results/`.

Bản dịch fixture là dữ liệu kiểm thử. Probe bộ dịch Chrome thật trong profile mới vẫn đang tải ngôn ngữ sau 12 giây; chưa có bằng chứng tải xong/dịch thành công từ probe đó. Nguồn DOM của player Udemy đã được đối chiếu trên tab đăng nhập, nhưng bản 0.2 chưa được kiểm chứng toàn bộ trên khóa học Udemy thật. Các bằng chứng này được ghi riêng, không suy từ fixture thành live E2E.

## Liên hệ & Đóng góp

- **Tác giả:** Cong Phan ([congphan.dev](https://congphan.dev))
- **Trang chủ:** [lecturesub.congphan.dev](https://lecturesub.congphan.dev)
- **Email:** [contact@congphan.dev](mailto:contact@congphan.dev)
- **Kho lưu trữ:** [github.com/cong85010/lecturesub-for-udemy](https://github.com/cong85010/lecturesub-for-udemy)

## Giấy phép (License)

Dự án phát hành theo [Giấy phép MIT](LICENSE) © 2026 Cong Phan.
