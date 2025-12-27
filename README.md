# Image Style Transfer

## Introduction

The **Image Style Transfer** project leverages artificial intelligence to automatically and efficiently transform the artistic style of images. Instead of using complex textual commands, the system allows users to provide a sample style image, and the model automatically extracts and applies the style onto the content image.

### Motivation

In today's digital era, image editing and creative content generation are increasingly popular. However, existing AI tools often require users to describe the style in words—an approach that is unintuitive and prone to unsatisfactory results. This project addresses that by enabling direct image-to-image style transfer.

## Objectives

Transform input images into outputs with the desired artistic style, providing users with a fun and creative experience.

### Input

-   **Content Image**: The image containing the subject, layout, and objects to retain.
-   **Style Image**: The image representing the artistic style to apply.
-   **Generated Image**: The output image optimized via content and style loss functions.

### Output

-   A stylized image that combines the content of the input image with the artistic style of the sample image.

## Datasets

### COCO2017 – Common Objects in Context

-   **Description**: A large dataset provided by Microsoft, containing diverse objects and scenes.
-   **Size**: 118,000 training images, 5,000 validation images, 41,000 test images.
-   **Sample Analysis**: 5,000 images randomly selected from the training set.
-   **Characteristics**:

    -   Average size: 578.5 × 481.8 pixels (~4:3 ratio)
    -   99.8% RGB, 0.2% grayscale
    -   Average brightness: 120–150
    -   Contrast: 60–70
    -   Saturation: 50–80

### WikiArt

-   **Description**: An art dataset from WikiArt.org containing paintings from multiple eras and styles.
-   **Size**: 81,444 images across 27 artistic styles.
-   **Sample Analysis**: 100 images randomly sampled from each style (random seed: 2025).
-   **Major Styles**:

    -   Impressionism: 13,060 images
    -   Realism: 10,733 images
    -   Romanticism: 7,019 images
    -   Expressionism: 6,736 images
    -   Post-Impressionism: 6,450 images
    -   Plus 22 other styles.

### Preprocessing

-   **Resize**: Longest side = 512 pixels, other side scaled proportionally.
-   **Data Augmentation**: Include grayscale images to increase diversity.
-   **Normalization**: Using ImageNet mean and standard deviation.

## Model Architecture

### 1. AdaIN (Adaptive Instance Normalization)

#### Principle

AdaIN aligns the statistics (mean and variance) of the content features with those of the style features:

```
AdaIN(x, y) = σ(y) * (x - μ(x)) / σ(x) + μ(y)
```

#### Architecture

-   **Encoder**: Pre-trained VGG-19 for feature extraction.
-   **AdaIN Layer**: Adjust mean and variance per channel.
-   **Decoder**:

    -   Reflection padding to reduce border artifacts.
    -   Progressive upsampling to increase resolution.
    -   Residual blocks to preserve content structure.
    -   Gradually reduce channels to output RGB image.

#### Loss Functions

-   **Content Loss**: `L_content = ||f(g) - AdaIN(f(c), f(s))||²`

    -   Mean Squared Error (MSE) between output features and AdaIN-transformed features.

-   **Style Loss**: `L_style = Σ(||μ(f_l(g)) - μ(f_l(s))||² + ||σ(f_l(g)) - σ(f_l(s))||²)`

    -   Compares mean and variance across multiple encoder layers.

-   **Total Loss**: `L_total = L_content + λ * L_style` (λ = 10)

### 2. SANet (Style-Attentional Network)

SANet is an advanced architecture using attention mechanisms to perform more precise style transfer, learning subtle relationships between content and style features.

## Evaluation Results

### Performance Comparison

| Metric                   | AdaIN     | SANet     | Notes                                      |
| ------------------------ | --------- | --------- | ------------------------------------------ |
| **Content Loss**         | 3.92      | 2.27      | SANet preserves content better             |
| **Style Loss**           | 5.85      | 6.92×10⁻⁷ | SANet achieves near-perfect style transfer |
| **Total Variation Loss** | 2,227,013 | 5,055,361 | SANet retains more texture/details         |
| **Total Loss**           | 2,227,075 | 505,538   | SANet overall better by 77.3%              |

## Conclusion

The Image Style Transfer project successfully builds an automated and effective artistic style transfer system. Comparing the two architectures:

-   **AdaIN**: Fast and efficient for real-time applications.
-   **SANet**: Superior quality with better content preservation and precise style transfer.

## Tools & Frameworks

-   **Programming Language**: Python
-   **Deep Learning Frameworks**: PyTorch
-   **Data Handling**: NumPy, Pandas
-   **Image Processing**: OpenCV, PIL, Matplotlib
-   **Web Backend**: FastAPI, Uvicorn
-   **Frontend**: Reactjs
-   **Visualization**: TensorBoard, Matplotlib

## Installation

### Backend

```bash
git clone https://github.com/c1khoa/style-transfer
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host localhost --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
