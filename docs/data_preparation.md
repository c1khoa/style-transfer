# 🧩 HƯỚNG DẪN CHUẨN BỊ DỮ LIỆU TRƯỚC KHI TRAIN MODEL

---

## 🪣 Bước 1. Tải dữ liệu

Nguồn dữ liệu:  
- **COCO2017:** [https://www.kaggle.com/datasets/awsaf49/coco-2017-dataset]
- **WIKIART:** [https://www.kaggle.com/datasets/steubk/wikiart]

Sau khi tải xong, chỉnh lại cây thư mục như sau:

```
data/
├── coco2017/
│   ├── annotations/
│   ├── test/
│   ├── train/
│   └── valid/
└── wikiart/
    ├── Abstract_Expressionism/
    ├── Action_painting/
    ├── Analytical_Cubism/
    ├── Art_Nouveau_Modern/
    ├── Baroque/
    └── Color_Field_Painting/
```

---

## 🎨 Bước 2. Sampling dữ liệu WikiArt

Do bộ **WikiArt** không cân bằng giữa các phong cách, ta cần **sampling** lấy tối đa `100 ảnh` cho mỗi phong cách.  
Nếu phong cách nào có ít hơn 100 ảnh, lấy toàn bộ ảnh.

- Chạy notebook: `00_Data_Preparation.ipynb`  
  👉 *Không chạy cell cuối cùng*.
- Notebook sẽ tự động tạo thư mục `wikiart_sampled` để lưu tập ảnh style sau khi sampling.

Cấu trúc đầu ra:

```
data/
└── wikiart_sampled/
    ├── train/
        ├── style_001.jpg
        ├── style_002.jpg
        ├──...
    ├── valid/
        ├── style_001.jpg
        ├── style_002.jpg
        ├──...
    ├── test/
        ├── style_001.jpg
        ├── style_002.jpg
        ├──...

```

Thư mục `wikiart_sampled` sẽ được sử dụng cho **train/test/valid** sau này.

---

## ⚙️ Bước 3. Load dữ liệu bằng DataLoader

Do dữ liệu rất lớn, **không nên load tất cả ảnh cùng lúc** vào RAM.  
Thay vào đó, sử dụng **PyTorch DataLoader** để đọc từng batch.

Ví dụ:

```python
loader = get_dataloaders(
    content_folder="../data/coco2017",
    style_folder="../data/wikiart_sampled",
    num_workers=4
)
```

Lúc này:
- `loader` khởi tạo `Dataset` và lưu **danh sách đường dẫn ảnh** chứ chưa load ảnh.  
- Ảnh chỉ được load **khi gọi**:  
  ```python
  content, style = next(iter(loader['train']))
  ```
- Mỗi batch có dạng `[batch_size, channel, height, width]`  
  (ví dụ: `[8, 3, 256, 256]` nếu để mặc định kích thước 256×256)
- Các ảnh của batch đều đã được resize, augment, tiền xử lý để sẵn sàng cho quá trình sử dụng
---

## 🔁 Vòng lặp huấn luyện mẫu

```python
for epoch in range(3):
    for content, style in loader["train"]:
        content, style = content.to(device), style.to(device)

        output, c_feat, s_feat = model(content, style)
        loss = calc_loss(output, content, style)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch+1} | Loss: {loss.item():.4f}")
```

---

## ✅ Tóm tắt

| Bước | Mục tiêu | Công cụ | Kết quả |
|------|-----------|---------|----------|
| 1 | Tải và tổ chức dữ liệu | Kaggle, OS | `data/` có cấu trúc chuẩn |
| 2 | Sampling dữ liệu style | Notebook `00_Data_Preparation.ipynb` | `data/wikiart_sampled/` |
| 3 | Load dữ liệu hiệu quả | `DataLoader` | Dữ liệu được load theo batch |