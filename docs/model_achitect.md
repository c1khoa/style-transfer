# KIẾN TRÚC MÔ HÌNH

## AdaIN (Adaptive Instance Normalization)

**Mục tiêu:** Thực hiện Neural Style Transfer real-time, style bất kỳ, preserve content.

### 1. Ý tưởng chính
- Tách **content** và **style** feature map.
- Chuyển style bằng cách điều chỉnh **mean** và **variance** của content theo style:
  
  $$
  \text{AdaIN}(content, style) = \sigma_{style} \left(\frac{content - \mu_{content}}{\sigma_{content}}\right) + \mu_{style}
  $$

  - $ \mu, \sigma $ là mean và std của feature map.

### 2. Kiến trúc
1. **Encoder:**  
   - Sử dụng một pretrained CNN (VGG-19 thường dùng).  
   - Trích xuất feature map từ content image và style image.
2. **Adaptive Instance Normalization (AdaIN):**  
   - Áp dụng transform mean/variance từ style vào content feature map.
3. **Decoder:**  
   - Mạng CNN giải mã feature map thành image output.
   - Học cách reconstruct ảnh từ feature map đã chuyển style.

### 3. Đặc điểm
- **Real-time:** ✅
- **Flexible style:** ✅ Hỗ trợ style bất kỳ.
- **Ưu điểm:** Nhanh, dễ triển khai, interactive demo.
- **Nhược điểm:** Một số style phức tạp có thể mờ hơn so với các phương pháp attention-based (SANet, AdaAttN).

## SANet (Style-Attention Network)

**Mục tiêu:** Thực hiện Neural Style Transfer real-time, style bất kỳ, preserve chi tiết content tốt hơn AdaIN nhờ attention.

### 1. Ý tưởng chính
- Thay vì chỉ dùng mean & variance (như AdaIN), SANet dùng **attention map** để kết nối feature của content và style.  
- Cho phép mỗi vị trí content “học” style phù hợp tại từng vùng, preserve texture & chi tiết tốt hơn.

### 2. Kiến trúc
1. **Encoder:**  
   - Pretrained CNN (VGG-19 thường dùng).  
   - Trích xuất feature map từ content image và style image.

2. **Style Attention Module (SANet):**  
   - Tạo **attention map** từ content & style feature.  
   - Kết hợp style feature vào content feature map theo attention.  

3. **Decoder:**  
   - CNN giải mã feature map đã kết hợp attention → ảnh styled.

### 3. Công thức attention (tóm tắt)
Inline math (GitHub-friendly):
$$ output_{feature}[i] = Σ_j (attention[i,j] * style_{feature}[j]) $$
- `i` là vị trí pixel content, `j` là vị trí feature style.  
- Attention map được tính từ content & style similarity.
### 4. Đặc điểm
- **Real-time:** ✅ Có thể chạy real-time trên GPU.  
- **Flexible style:** ✅ Hỗ trợ style bất kỳ.  
- **Ưu điểm:** Preserve texture và chi tiết content tốt hơn AdaIN.  
- **Nhược điểm:** Mạng nặng hơn AdaIN, inference chậm hơn đôi chút.
