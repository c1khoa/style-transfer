## ModelSelector:
- Chọn và trả về model tương ứng, cần xử lý nếu dùng sanet hay adain
## ModeSelector:
- Chọn và trả về loại input gồm ảnh, video hoặc webcam (webcam hiện có thể mở nhưng gửi về backend đúng chưa thì không biết)
## ResultBox:
- Hiện đang set result là style image kiểm tra nếu backend trả về đúng result
## StyleBox:
- Hiện có phần fetch đến file styles.json file này chứa đường dẫn đến 1 số ảnh style gợi ý, các ảnh này được đặt tương ứng tại folder public/styles. lựa chọn ảnh nào mà model làm tốt bỏ vào đây và thay thế các ảnh có trong styles (hiện đang để làm mẫu).
## App.jsx:
- Xử lý chính, có phần START PROCESSING làm xử lý việc gửi input đến backend và load output từ backend, sửa phần này để hoạt động được trên backend thay vì mock data.

## Hướng dẫn chạy
- Tại thư mục đồ án cd đến frontend
- gõ `npm install` cho lần đầu
- hoặc `npm run dev` cho các lần sau
- Tớ code bằng gpt nên lỗi gì ae cú tớ :> tớ chịu