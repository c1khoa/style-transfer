# Image Style Transfer - Đồ Án Nhóm

## 📋 Tổng Quan Dự Án

### Giới Thiệu

Dự án **Image Style Transfer** nghiên cứu và triển khai các phương pháp chuyển đổi phong cách nghệ thuật cho ảnh sử dụng Deep Learning. Thay vì sử dụng câu lệnh văn bản (text prompts), hệ thống cho phép người dùng cung cấp một ảnh phong cách mẫu để tự động áp dụng lên ảnh nội dung.

### Động Lực

-   **Vấn đề hiện tại**: Các hệ thống AI hiện nay (ChatGPT, Gemini) yêu cầu câu lệnh văn bản chính xác, khó kiểm soát kết quả
-   **Giải pháp đề xuất**: Sử dụng ảnh phong cách trực tiếc → đơn giản hơn, trực quan hơn, kết quả dễ đoán hơn
-   **Mục tiêu**: Xây dựng hệ thống xử lý nhanh (tương đương hoặc tốt hơn các công cụ hiện tại), kết quả chất lượng cao

---

## 🎯 Bài Toán

### Mục Tiêu

Chuyển đổi ảnh đầu vào thành ảnh có phong cách nghệ thuật mong muốn, mang lại trải nghiệm sáng tạo thú vị cho người dùng.

### Input/Output

-   **Content Image**: Ảnh chứa nội dung, bố cục, đối tượng cần giữ nguyên
-   **Style Image**: Ảnh đại diện cho phong cách nghệ thuật muốn áp dụng
-   **Output**: Ảnh đã được chuyển đổi phong cách, giữ nguyên nội dung gốc nhưng mang phong cách của style image

### Ràng Buộc

1. **Content Loss**: Giữ cấu trúc và bố cục của ảnh gốc (đo bằng feature maps từ CNN như VGG)
2. **Style Loss**: Tái tạo texture, màu sắc, họa tiết của ảnh style (đo bằng Gram matrix)
3. **Điều kiện bổ sung** (tùy chọn): Giữ độ tương phản, độ sáng, áp dụng phong cách theo vùng

---

## 🏗️ Kiến Trúc Mô Hình

Trong dự án Artistic Style Transfer, nhóm triển khai hai mô hình chính — AdaIN và SANet, với encoder VGG19 pretrained trên ImageNet.

Chỉ phần decoder và style module được huấn luyện lại để tối ưu hiệu ứng truyền phong cách, giúp tiết kiệm thời gian và tài nguyên.

### 1. AdaIN (Adaptive Instance Normalization) ⭐

**Ý tưởng**: Chuẩn hóa feature map của content theo thống kê (mean, variance) của style

**Công thức**: `AdaIN(x, y) = σ(y) * ((x - μ(x)) / σ(x)) + μ(y)`

**Ưu điểm**:

-   ✅ Arbitrary style transfer (áp dụng bất kỳ phong cách nào)
-   ✅ Tốc độ nhanh, kết quả tự nhiên
-   ✅ Dễ triển khai, ít tài nguyên

**Nhược điểm**:

-   ⚠️ Đôi khi mất chi tiết nhỏ khi style quá mạnh

---

### 2. SANet (Style-Attentional Network) ⭐

**Ý tưởng**: Sử dụng attention mechanism để học ánh xạ không gian giữa content và style

**Ưu điểm**:

-   ✅ Giữ chi tiết content tốt hơn AdaIN
-   ✅ Style tự nhiên, mượt mà hơn
-   ✅ Kiểm soát tốt hơn vùng áp dụng style

**Nhược điểm**:

-   ⚠️ Huấn luyện và inference nặng hơn AdaIN
-   ⚠️ Cần nhiều tài nguyên GPU hơn

---

### 3. StyTr² (Style Transformer) 🎯 **OPTIONAL**

**Ý tưởng**: Vision Transformer với cross-attention cho style transfer

**Ưu điểm**:

-   ✅ Ánh xạ style–content linh hoạt nhất
-   ✅ Giữ chi tiết tốt, hiệu ứng mượt mà

**Nhược điểm**:

-   ⚠️ Tốc độ chậm, tốn GPU RAM
-   ⚠️ Khó triển khai

---

## 📊 Dataset

| Loại        | Tên Dataset | Quy Mô                       | Ghi Chú                |
| ----------- | ----------- | ---------------------------- | ---------------------- |
| **Content** | COCO 2017   | 118k train, 5k val           | Ảnh thực tế đời thường |
| **Style**   | WikiArt     | 1,620 ảnh (60/27 phong cách) | Tranh nghệ thuật       |

**Thống kê WikiArt**:

-   Median: 346 × 399 px
-   Resize: cạnh ngắn = 512px
-   Ảnh trùng lặp: 0.68% (đã loại bỏ)

---

## 👥 Phân Công Công Việc

### 👤 **Anh Khoa: Nhóm trưởng** (Coordination + AdaIN Core)

**Trách nhiệm chính**:

-   📋 **Quản lý dự án**: Timeline, phân công, theo dõi tiến độ
-   🔗 **Tích hợp**: Đảm bảo các phần code của mọi người hoạt động cùng nhau
-   📝 **Documentation**: README, báo cáo cuối kỳ, presentation

**Công việc kỹ thuật**:

1. **AdaIN Implementation** (Core Model):

    - Implement Encoder (VGG19)
    - Implement AdaIN layer
    - Implement Decoder
    - Setup training pipeline cơ bản

2. **Integration**:

    - Tích hợp data pipeline từ Hồng Hạnh
    - Tích hợp evaluation từ Nick Võ
    - Testing end-to-end pipeline

3. **Advanced Features** (nếu có thời gian):
    - Regional style transfer
    - Style strength control
    - Multi-style blending

**Deliverables**:

-   [ ] Notebook: `01_AdaIN_Training.ipynb`
-   [ ] Trained weights: `adain_model.pth`
-   [ ] Script: `adain.py`, `main.py`, `infer.py`, `train_utils.py`
-   [ ] Config: `adain_config.yaml`
-   [ ] Results: github and drive
-   [ ] `README.md` tổng hợp
-   [ ] Báo cáo cuối kỳ

---

### 👤 **Hồng Hạnh: Data Engineer**

**Trách nhiệm chính**:

-   💾 **Data Pipeline**: Download, xử lý, tổ chức dataset
-   📊 **EDA**: Phân tích và visualize dữ liệu
-   🔧 **Utils**: Viết helper functions cho data loading

**Công việc kỹ thuật**:

1. **Dataset Preparation**:

    - Download COCO 2017, WikiArt
    - Xử lý, resize, normalize ảnh
    - Loại bỏ ảnh trùng lặp

2. **EDA & Analysis**:

    - Phân tích phân phối kích thước, aspect ratio
    - Thống kê màu sắc (HSV)
    - Visualize samples từ 27 phong cách
    - Identify potential issues

3. **DataLoader**:
    - Code DataLoader cho training
    - Data augmentation pipeline
    - Batch processing utilities

**Deliverables**:

-   [ ] Notebook: `00_Data_Preparation.ipynb`
-   [ ] Script: `utils/data_utils.py`
-   [ ] EDA report (markdown/PDF)

---

### 👤 **Khang Hy: Model Developer** (SANet)

**Trách nhiệm chính**:

-   🧠 **SANet Implementation**: Xây dựng model thứ 2
-   🔬 **Experiments**: Thử nghiệm hyperparameters
-   📈 **Optimization**: Cải thiện performance

**Công việc kỹ thuật**:

1. **SANet Implementation**:

    - Implement Content & Style Encoder
    - Implement Attention Module
    - Implement Decoder
    - Setup training pipeline

2. **Training & Optimization**:
    - Training SANet với loss functions
    - Hyperparameter tuning
    - Monitoring attention maps
    - So sánh với AdaIN

**Deliverables**:

-   [ ] Notebook: `02_SANet_Training.ipynb`
-   [ ] Trained weights: `sanet_model.pth`
-   [ ] Script: `sanet.py`
-   [ ] Notebook: `03_Model_Comparison.ipynb`
-   [ ] Config: `sanet_config.yaml`
-   [ ] Results: github and drive
-   [ ] Comparison report

---

### 👤 **Nick Võ: Evaluation & Demo**

**Trách nhiệm chính**:

-   📏 **Evaluation**: Đánh giá chất lượng models
-   🎨 **Demo Application**: Xây dựng giao diện demo
-   📊 **Visualization**: Visualize kết quả

**Công việc kỹ thuật**:

1. **Evaluation Framework**:

    - Implement metrics: FID, LPIPS, SSIM
    - Content loss, Style loss calculation
    - Inference time benchmark
    - Create test suite với diverse samples

2. **Visualization**:

    - So sánh content/style/output side-by-side
    - Attention map visualization (cho SANet)
    - Loss curves, training progress plots
    - Quality comparison between models

3. **Demo Application**:
    - Gradio/Streamlit app trên Colab
    - Upload content + style images
    - Real-time inference
    - Style strength slider (optional)

**Deliverables**:

-   [ ] Notebook: `04_Evaluation_Metrics.ipynb`
-   [ ] Notebook: `05_Results_Visualization.ipynb`
-   [ ] Notebook: `06_Demo_Application.ipynb`
-   [ ] Script: `eval_utils.py`, `eval.py`
-   [ ] Script: `viz_utils.py`
-   [ ] Evaluation report với metrics
-   [ ] Demo video/screenshots

---

## 📅 Timeline (8 Tuần)

### **Week 1: Setup & Planning**

-   [ ] Setup Drive structure, GitHub repo
-   [ ] Hồng Hạnh: Bắt đầu download dataset
-   [ ] Toàn team: Đọc papers (AdaIN, SANet)

### **Week 2: Data & Foundation**

-   [ ] Hồng Hạnh: Hoàn thành data pipeline + EDA ✅
-   [ ] Anh Khoa: Bắt đầu AdaIN implementation
-   [ ] Khang Hy: Nghiên cứu SANet architecture
-   [ ] Nick Võ: Setup evaluation framework

### **Week 3-4: AdaIN Development**

-   [ ] Anh Khoa: Hoàn thành AdaIN implementation ✅
-   [ ] Anh Khoa: Bắt đầu training AdaIN
-   [ ] Khang Hy: Bắt đầu implement SANet
-   [ ] Nick Võ: Test evaluation metrics

### **Week 5-6: SANet & Evaluation**

-   [ ] Anh Khoa: AdaIN training hoàn thành ✅
-   [ ] Khang Hy: SANet training ✅
-   [ ] Nick Võ: Evaluate cả 2 models
-   [ ] Nick Võ: Bắt đầu demo app

### **Week 7: Integration & Demo**

-   [ ] Anh Khoa: Tích hợp toàn bộ pipeline
-   [ ] Nick Võ: Hoàn thành demo app ✅
-   [ ] Toàn team: Testing end-to-end
-   [ ] Anh Khoa: Draft báo cáo

### **Week 8: Finalization**

-   [ ] Anh Khoa: Hoàn thành documentation ✅
-   [ ] Toàn team: Chuẩn bị presentation
-   [ ] Nick Võ: Record demo video
-   [ ] Final review & submission

---

## 📁 Cấu Trúc Google Drive

```
📁 Artistic_Style_Transfer/
│
├── 📁 00_Documents/
│   ├── Final_Report.pdf
│   └── Papers/
│       ├── AdaIN_Paper.pdf
│       └── SANet_Paper.pdf
│
├── 📁 01_Datasets/
│   ├── 📁 content_samples/      ← Ảnh nội dung (content images, 20–30 ảnh)
│   ├── 📁 style_samples/        ← Ảnh phong cách (style images, 20–30 ảnh)
│   └── pairs.csv                ← File ghép cặp content–style
│
├── 📁 02_Notebooks/
│   ├── AdaIN_Train_Finetune.ipynb   ← Huấn luyện & tinh chỉnh AdaIN
│   ├── SANet_Train_Finetune.ipynb   ← Huấn luyện & tinh chỉnh SANet
│   ├── Evaluate_Models.ipynb        ← Đánh giá & so sánh 2 mô hình
│   └── Visualize_Results.ipynb      ← Hiển thị kết quả trực quan
│
├── 📁 03_Models/
│   ├── adain_pretrained.pth         ← Trọng số AdaIN pretrained
│   ├── sanet_pretrained.pth         ← Trọng số SANet pretrained
│   └── vgg19_encoder.pth            ← Encoder trích xuất đặc trưng
│
├── 📁 04_Results/
│   ├── 📁 AdaIN/
│   │   ├── pair_1/
│   │   │   ├── content.jpg
│   │   │   ├── style.jpg
│   │   │   └── output.jpg
│   │   └── ...
│   ├── 📁 SANet/
│   │   └── tương tự
│   ├── comparisons.csv              ← So sánh AdaIN vs SANet cho từng cặp
│   └── metrics.csv                  ← Tổng hợp chỉ số đánh giá trung bình
│
└── 📁 05_Demo/

```

---

## 🗂️ Cấu Trúc GitHub Repository

```
image-style-transfer/
│
├── README.md                          # File mô tả toàn bộ dự án (file này)
├── .gitignore                         # Loại bỏ checkpoints, datasets, models
├── requirements.txt                   # Danh sách dependencies (tham khảo)
│
├── 📁 notebooks/                      # Nơi làm việc chính
│   ├── 00_Data_Preparation.ipynb      ← Chuẩn bị dữ liệu (resize, normalize, pairs.csv)
│   ├── 01_AdaIN_Training.ipynb        ← Huấn luyện AdaIN
│   ├── 02_SANet_Training.ipynb        ← Huấn luyện SANet
│   ├── 03_Model_Comparison.ipynb      ← So sánh output hai mô hình
│   ├── 04_Evaluation_Metrics.ipynb    ← Tính LPIPS, SSIM, Style Loss,...
│   ├── 05_Results_Visualization.ipynb ← Hiển thị kết quả trực quan
│   └── 06_Demo_Application.ipynb      ← Giao diện demo chọn ảnh & xem kết quả
│
├── 📁 src/
│   ├── 📁 models/                      # Chứa toàn bộ kiến trúc mạng
│   │   ├── adain.py                   ← Model AdaIN (encoder, decoder, AdaIN layer)
│   │   ├── sanet.py                   ← Model SANet (Self-Attention Network)
│   │   └── __init__.py
│   │
│   ├── 📁 utils/                       # Các hàm tiện ích
│   │   ├── data_utils.py              ← Load ảnh, augmentation, ghép cặp
│   │   ├── train_utils.py             ← Train loop helpers: save, load, EMA
│   │   ├── eval_utils.py              ← LPIPS, SSIM, MS-SSIM, Gram loss
│   │   └── viz_utils.py               ← Plot, visualize style transfer, attention map
│   │
│   ├── 📁 configs/                     # File cấu hình siêu tham số
│   │   ├── adain_config.yaml          ← learning_rate, batch_size, content_weight,...
│   │   └── sanet_config.yaml          ← thông số huấn luyện SANet
│   │
│   ├── train.py                       ← Entry point huấn luyện
│   ├── infer.py                       ← Entry point inference
│   ├── eval.py                        ← Entry point evaluation
│   └── main.py                        ← Entry point chung cho dự án style transfer
│
├── 📁 docs/                           # Tài liệu chi tiết (markdown)
│   ├── data_preparation.md            ← Hướng dẫn xử lý & tổ chức dữ liệu
│   ├── model_architecture.md          ← Giải thích AdaIN & SANet
│   ├── evaluation_metrics.md          ← Cách tính các chỉ số đánh giá
│   └── images/                        ← Hình minh họa cho tài liệu
│
└── 📁 results/                        # Kết quả mẫu kích thước nhỏ
    ├── sample_outputs/                ← Một vài output minh họa
    └── demo_screenshots/              ← Ảnh chụp màn hình demo

```

**⚠️ LƯU Ý QUAN TRỌNG**:

-   **KHÔNG commit** datasets, models weights, large files lên GitHub
-   Chỉ commit: notebooks, scripts, configs, documentation
-   Models & data (ví dụ) lưu trên **Google Drive**
-   Dùng `.gitignore` để exclude folders lớn

---

## 🔄 Git Workflow (Đơn Giản Cho 4 Người)

### Branch Strategy

```
main (protected - chỉ merge khi hoàn thành)
  ├── dev (development - branch chính để làm việc)
  │   ├── data-pipeline      [Hồng Hạnh]
  │   ├── adain-model         [Anh Khoa]
  │   ├── sanet-model         [Khang Hy]
  │   └── evaluation-demo     [Nick Võ]
```

### Quy Trình Làm Việc

**1. Setup ban đầu** (Nhóm trưởng):

```bash
# Tạo repo và clone
git clone https://github.com/your-team/image-style-transfer.git
cd image-style-transfer

# Tạo branch dev
git checkout -b dev
git push -u origin dev
```

**2. Mỗi thành viên làm việc trên branch riêng**:

```bash
# Tạo branch từ dev
git checkout dev
git pull origin dev
git checkout -b data-pipeline    # Hoặc tên branch của bạn

# Làm việc trên Colab, commit changes
git add notebooks/00_Data_Preparation.ipynb
git commit -m "Add data preprocessing pipeline"
git push origin data-pipeline

# Tạo Pull Request trên GitHub để merge vào dev
```

**3. Review & Merge**:

-   Mỗi PR cần nhóm trưởng review trước khi merge
-   Merge vào `dev` thường xuyên (mỗi tuần)
-   Chỉ merge vào `main` khi milestone hoàn thành

**4. Sync thường xuyên**:

```bash
# Trước khi bắt đầu làm việc
git checkout dev
git pull origin dev
git checkout your-branch
git merge dev    # Merge changes mới nhất từ dev
```

---

## 🛠️ Tech Stack & Tools

### Development Environment

-   **Primary**: Google Colab (GPU: T4/V100)
-   **Storage**: Google Drive (sync với Colab)
-   **Version Control**: GitHub

### Core Libraries

```python
# Deep Learning
torch >= 2.0.0
torchvision >= 0.15.0
tensorflow >= 2.12.0  # (optional, nếu dùng)

# Computer Vision
opencv-python
Pillow
torchvision

# Evaluation Metrics
pytorch-fid
lpips
scikit-image

# Visualization
matplotlib
seaborn
plotly

# Demo
gradio >= 3.50.0      # Preferred for Colab
# streamlit            # Alternative

# Utils
numpy
pandas
tqdm
PyYAML
```

## 📏 Evaluation Metrics

### Objective Metrics

1. **Content Loss**: MSE trên VGG feature maps
2. **Style Loss**: MSE trên Gram matrices
3. **FID Score**: Fréchet Inception Distance
4. **LPIPS**: Learned Perceptual Image Patch Similarity
5. **Inference Time**: ms/image (512×512)

### Subjective Evaluation (Optional)

-   Visual comparison grid
-   User preference survey (nếu có thời gian)

---

## 🎯 Success Criteria

### Minimum (Pass) ✅

-   [x] AdaIN model training thành công
-   [x] FID < 100 trên test set
-   [x] Inference < 1s/image (Colab GPU)
-   [x] Demo app functional

### Target (Good) 🎯

-   [x] Cả AdaIN và SANet hoạt động tốt
-   [x] FID < 80, LPIPS < 0.3
-   [x] Comparative analysis
-   [x] Demo với style strength control

### Stretch (Excellent) 🌟

-   [x] StyTr² exploration/integration
-   [x] Regional style transfer
-   [x] Publication-quality documentation

---

## 📚 Tài Liệu Tham Khảo

### Papers

1. **AdaIN**: [Arbitrary Style Transfer in Real-time](https://arxiv.org/abs/1703.06868)
2. **SANet**: [Arbitrary Style Transfer with Style-Attentional Networks](https://arxiv.org/abs/1812.02342)
3. **StyTr²**: [Image Style Transfer with Transformers](https://arxiv.org/abs/2105.14576)

### Implementation References

-   [Official AdaIN PyTorch](https://github.com/naoto0804/pytorch-AdaIN)
-   [SANet Implementation](https://github.com/GlebSBrykin/SANET)

### Datasets

-   [COCO 2017](https://cocodataset.org/#download)
-   [WikiArt](https://www.wikiart.org/)

---

## ✅ Checklist Tổng Hợp

### Setup Phase (Week 1)

-   [ ] Tạo GitHub repo (Nhóm trưởng)
-   [ ] Setup Drive structure (Nhóm trưởng)
-   [ ] Thêm tất cả members vào Drive + GitHub
-   [ ] Đọc papers (All)
-   [ ] Làm quen với codebase mẫu (All)

### Development Phase (Week 2-6)

-   [ ] Data pipeline hoàn chỉnh (Hồng Hạnh)
-   [ ] EDA report (Hồng Hạnh)
-   [ ] AdaIN implementation (Anh Khoa)
-   [ ] AdaIN trained model (Anh Khoa)
-   [ ] SANet implementation (Khang Hy)
-   [ ] SANet trained model (Khang Hy)
-   [ ] Evaluation framework (Nick Võ)

### Finalization Phase (Week 7-8)

-   [ ] Integration testing (Anh Khoa)
-   [ ] Comprehensive evaluation (Nick Võ)
-   [ ] Demo app (Nick Võ)
-   [ ] Documentation complete (Anh Khoa)
-   [ ] Presentation slides (All)
-   [ ] Final report (Anh Khoa)
-   [ ] Submission (Anh Khoa)
