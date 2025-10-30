from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as T
import torchvision.transforms.functional as F
from tqdm import tqdm
from PIL import Image
import shutil
import random
import os
import glob


# ============================================================
# STYLE SAMPLING
# ============================================================
def style_sampling(base_path, dest_path, n_samples=100, split=(0.8, 0.1, 0.1)):
    """
    Lấy mẫu ảnh từ mỗi style và chia đều train/valid/test.
    Đặt tên file dạng style_001.jpg, style_002.jpg...

    Args:
        base_path (str): Thư mục chứa các folder style.
        dest_path (str): Thư mục lưu kết quả.
        n_samples (int): Số ảnh lấy mẫu cho mỗi style.
        split (tuple): Tỉ lệ chia train/valid/test.
    """
    random.seed(2025)

    subsets = ["train", "valid", "test"]
    for subset in subsets:
        os.makedirs(os.path.join(dest_path, subset), exist_ok=True)

    styles = [d for d in os.listdir(base_path)
              if os.path.isdir(os.path.join(base_path, d))]

    total_copied = 0

    for style in tqdm(styles, desc="Sampling styles"):
        style_path = os.path.join(base_path, style)

        # Lọc file ảnh hợp lệ
        image_files = [
            f for f in os.listdir(style_path)
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff'))
        ]
        if not image_files:
            continue

        # Lấy mẫu ngẫu nhiên
        sample_imgs = random.sample(image_files, min(len(image_files), n_samples))
        n = len(sample_imgs)

        # Số lượng cho train/valid/test
        n_train = int(n * split[0])
        n_valid = int(n * split[1])
        n_test = n - n_train - n_valid

        # Chia ảnh
        split_dict = {
            "train": sample_imgs[:n_train],
            "valid": sample_imgs[n_train:n_train + n_valid],
            "test": sample_imgs[n_train + n_valid:]
        }

        # Copy ảnh sang folder tương ứng
        for subset, imgs in split_dict.items():
            dest_folder = os.path.join(dest_path, subset)
            for idx, img_name in enumerate(imgs, start=1):
                src = os.path.join(style_path, img_name)
                dst_name = f"{style}_{idx:03d}.jpg"  # style_001.jpg
                dst = os.path.join(dest_folder, dst_name)
                shutil.copy(src, dst)
                total_copied += 1

    print(f"Đã sao chép {total_copied} ảnh từ {len(styles)} style vào {dest_path}/train, valid, test")


# ============================================================
# TRANSFORM
# ============================================================
class TransformImageNet:
    def __init__(self, target_long=512, min_short=256, crop_size=None, gray_ratio=0.0):
        """
        Args:
            target_long (int): Cạnh lớn của ảnh sau khi resize.
            min_short (int): Nếu cạnh nhỏ < min_short, sẽ padding.
            crop_size (int | None): Kích thước crop ngẫu nhiên (None = không crop).
            gray_ratio (float): Xác suất chuyển ảnh sang grayscale.
        """
        self.target_long = target_long
        self.min_short = min_short
        self.crop_size = crop_size
        self.gray_ratio = gray_ratio

        self.to_tensor = T.ToTensor()
        self.normalize = T.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )

    def resize_and_pad(self, img):
        """Resize theo cạnh lớn và pad nếu cạnh nhỏ < min_short."""
        w, h = img.size

        # Scale theo cạnh lớn
        if w > h:
            new_w = self.target_long
            new_h = int(h * self.target_long / w)
        else:
            new_h = self.target_long
            new_w = int(w * self.target_long / h)

        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Padding nếu cần
        pad_w = max(0, self.min_short - new_w)
        pad_h = max(0, self.min_short - new_h)
        if pad_w > 0 or pad_h > 0:
            img = F.pad(img, (0, 0, pad_w, pad_h), fill=0)

        return img

    def __call__(self, img):
        """Gọi trực tiếp để thực hiện transform."""
        # Grayscale augmentation
        if random.random() < self.gray_ratio:
            img = img.convert("L").convert("RGB")

        img = self.resize_and_pad(img)

        # Random crop nếu có
        if self.crop_size:
            img = T.RandomCrop(self.crop_size)(img)

        img = self.to_tensor(img)
        img = self.normalize(img)
        return img


# ============================================================
# DATASET
# ============================================================
class CustomImageDataset(Dataset):
    def __init__(self, content_folder, style_folder, subset,
                 transform=None, gray_ratio=0.2,
                 valid_ext=('.jpg', '.jpeg', '.png', '.bmp', '.tiff')):
        """
        Dataset kết hợp content và style image.

        Args:
            content_folder (str): Thư mục chứa ảnh content.
            style_folder (str): Thư mục chứa ảnh style.
            subset (str): Tên tập con ('train', 'valid', 'test').
            transform (callable): Hàm transform ảnh.
            gray_ratio (float): Xác suất chuyển grayscale.
        """
        self.content_folder = os.path.join(content_folder, subset)
        self.style_folder = os.path.join(style_folder, subset)

        self.content_files = []
        self.style_files = []

        for ext in valid_ext:
            self.content_files.extend(glob.glob(os.path.join(self.content_folder, f"*{ext}")))
            self.style_files.extend(glob.glob(os.path.join(self.style_folder, f"*{ext}")))

        self.content_files = sorted(self.content_files)
        self.style_files = sorted(self.style_files)

        if len(self.content_files) == 0:
            raise RuntimeError(f"No content images found in {self.content_folder}")
        if len(self.style_files) == 0:
            raise RuntimeError(f"No style images found in {self.style_folder}")

        self.transform = transform
        self.gray_ratio = gray_ratio

    def __len__(self):
        return len(self.content_files)

    def __getitem__(self, idx):
        # Content image
        content_path = self.content_files[idx]
        content_img = Image.open(content_path).convert("RGB")
        
        # Style image (random)
        style_path = random.choice(self.style_files)
        style_img = Image.open(style_path).convert("RGB")
        
        # Apply transform
        if self.transform:
            content_img = self.transform(content_img)
            style_img = self.transform(style_img)

        return content_img, style_img


# ============================================================
# DATALOADER FACTORY
# ============================================================
def get_dataloaders(content_folder, style_folder,
                    batch_size=8, num_workers=4, gray_ratio=0.2,
                    target_long=512, min_short=256, crop_size=256):
    """
    Tạo DataLoader cho train/valid/test.
    Giả sử content_folder và style_folder đã có subfolder 'train', 'valid', 'test'.
    Có thể bật tqdm để quan sát tiến trình load dữ liệu.
    """
    transform = TransformImageNet(
        target_long=target_long,
        min_short=min_short,
        crop_size=crop_size,
        gray_ratio=gray_ratio
    )

    loaders = {}
    for subset in ["train", "valid", "test"]:
        dataset = CustomImageDataset(
            content_folder,
            style_folder,
            subset=subset,
            transform=transform,
            gray_ratio=gray_ratio
        )

        shuffle = (subset == "train")

        loader = DataLoader(
            dataset,
            batch_size=batch_size,
            shuffle=shuffle,
            num_workers=num_workers,
            pin_memory=True
        )

        loaders[subset] = loader

    return loaders
