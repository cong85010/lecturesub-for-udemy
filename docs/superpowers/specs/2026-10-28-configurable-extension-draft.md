# CC Udemy — cấu hình đa ngôn ngữ và UI/UX

Trạng thái: triển khai theo yêu cầu mở rộng; người dùng không có ưu tiên tính năng học thêm, người triển khai chọn cấu hình + lưu từ vựng như đã trình bày. Giữ ràng buộc miễn phí, không cần API key; AI qua API vẫn để sau.

## Yêu cầu mới đã có

- Chọn được ngôn ngữ.
- Có cấu hình đầy đủ hơn.
- Cải thiện UI/UX trên nền extension hiện tại.
- Thêm tính năng học; ưu tiên cụ thể đang được hỏi người dùng.

## Phạm vi đề xuất

### Ngôn ngữ

Chọn ngôn ngữ phụ đề nguồn và ngôn ngữ dịch. Mặc định Anh → Việt, không khóa cứng hai ngôn ngữ trong nhãn, adapter, cache hay provider nữa. Kiểm tra khả dụng của cặp ngôn ngữ bằng Chrome Translator; cặp không hỗ trợ có giải thích. Đổi cặp sẽ hủy kết quả đang chờ ở cặp cũ. Cache phải phân vùng theo cả ngôn ngữ nguồn và đích; không tái sử dụng cache Anh–Việt cho cặp khác.

Ưu tiên native text tracks nếu có. Với player Udemy chỉ cung cấp DOM cue, người dùng phải chọn cùng ngôn ngữ nguồn trong menu CC của Udemy; không hứa đổi được track nếu chưa có nguồn hay API player được kiểm chứng.

### Hiển thị phụ đề

Chế độ song ngữ, chỉ nguồn hoặc chỉ bản dịch; đảo thứ tự hai dòng. Cỡ chữ nguồn/đích riêng; font chữ, độ đậm, màu từng dòng, độ mờ nền, khoảng cách dòng, chiều rộng và khoảng cách tới đáy player. Có nút đặt lại mặc định và xem trước bằng nội dung mẫu được ghi nhãn.

Thiết lập đổi ngay trên video và lưu cục bộ; dữ liệu cũ chỉ có `enabled`/`fontSize` được nâng cấp tự động. Mọi dữ liệu cấu hình đều được chuẩn hóa và giới hạn phạm vi trước khi đi vào DOM/CSS.

### Tra từ và hành vi xem

Chọn bật/tắt tự tạm dừng khi tra từ, bật/tắt tự tiếp tục khi đóng. Giữ hỗ trợ bàn phím và trạng thái phát/dừng đúng khi chuyển từ, đổi bài hoặc đổi ngôn ngữ.

Lưu từ với nghĩa, ngôn ngữ, câu gốc, URL bài giảng và thời điểm. Danh sách từ có tìm kiếm, xóa từng mục và xuất CSV an toàn với ứng dụng bảng tính. Giới hạn 2.000 từ, chống trùng theo cặp ngôn ngữ + từ không phân biệt hoa/thường. Chỉ lưu sau khi đã có nghĩa, dữ liệu nằm cục bộ. Phím tắt Alt+Shift+C bật/tắt phụ đề (có thể tắt); không chạy khi người dùng nhập liệu. Phát lại/lặp câu chính xác để sau vì DOM cue chưa có timestamp chuẩn.

### Giao diện

Giữ video là vùng chính. Thanh điều khiển trên video thu gọn; cấu hình chi tiết vào bảng cài đặt có nhóm rõ ràng. Popup extension có điều khiển nhanh, trạng thái bộ dịch và lối vào cài đặt đầy đủ.

Kế thừa thiết kế đang có: nền tối ở player, màu tím cho hành động, bản dịch dễ phân biệt. Không thêm hàng loạt nút che bài giảng. Bảng cài đặt có cuộn, nhãn điều khiển rõ ràng, focus, Escape, bố cục phù hợp player hẹp và fullscreen.

## Kiểm thử cần có

- Di trú settings cũ và chặn giá trị ngoài phạm vi.
- Cách ly cache/công việc bất đồng bộ khi đổi ngôn ngữ.
- Cặp cùng ngôn ngữ, không hỗ trợ, cần tải và tải lỗi.
- Đổi cấu hình giữa nhiều tab mà không ghi đè thiết lập mới hơn.
- Ba chế độ hiển thị, đảo thứ tự và cấu hình chữ riêng trên player hẹp/toàn màn hình.
- Hành vi tra từ và hoàn nguyên phụ đề native không hồi quy.
- Kiểm thử fixture và đối chiếu Udemy thực tế được ghi nhận riêng.

## Quyết định triển khai

Trang cài đặt mở trong tab riêng: cấu hình có nhóm, xem trước, tự lưu, nút mặc định chỉ reset cấu hình (không xóa từ đã lưu), tab Từ vựng. Popup chứa ngôn ngữ/chế độ/bật tắt và lối vào cài đặt. Nút cài đặt và lưu từ dùng background message handler nội bộ, chỉ quyền storage. Ghi settings và từ vựng qua một hàng đợi ở service worker để hai tab không ghi đè nhau. Bộ dịch giữ gesture trực tiếp ở content script; đổi cặp hủy generation cũ và tách cache theo source/target. Di trú fontSize cũ sang hai font size; chỉ nhập cache cũ vào Anh–Việt. Không thêm API AI, speech recognition, transcript hay flashcards trong đợt này.
