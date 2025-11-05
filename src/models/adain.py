import torch
import torch.nn as nn
import torchvision.models as models

class VGGEncoder(nn.Module):
    def __init__(self, path_vgg_weights=None, device='cpu'):
        super(VGGEncoder, self).__init__()
        self.device = device  # lưu device để dùng khi forward
        if path_vgg_weights is None:
            vgg16 = models.vgg16(pretrained=True)
        else:
            vgg16 = models.vgg16()
            vgg16.load_state_dict(torch.load(path_vgg_weights, map_location=device))

        # Chỉ lấy feature tới conv4_3
        self.encoder_layers = nn.Sequential(*list(vgg16.features.children())[:21])

        # Freeze weights
        for param in self.encoder_layers.parameters():
            param.requires_grad = False

        # Chuyển encoder sang device
        self.encoder_layers.to(device)  

    def forward(self, x):
        x = x.to(self.device)
        x = self.encoder_layers(x)
        return x

class ResidualBlock(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.ReflectionPad2d(1),
            nn.Conv2d(channels, channels, kernel_size=3),
            nn.ReLU(inplace=True),
            nn.ReflectionPad2d(1),
            nn.Conv2d(channels, channels, kernel_size=3)
        )

    def forward(self, x):
        return x + self.block(x)

class ConvBlock(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.Upsample(scale_factor=2, mode='nearest'),
            nn.ReflectionPad2d(1),
            nn.Conv2d(in_channels, out_channels, 3),
            nn.ReLU(inplace=True),
            ResidualBlock(out_channels)
        )

    def forward(self, x):
        return self.block(x)
    
class Decoder(nn.Module):
    def __init__(self, out_channels=3):
        super().__init__()
        self.decoder_layers = nn.Sequential(
            nn.ReflectionPad2d(1),
            nn.Conv2d(512, 256, 3),
            nn.ReLU(inplace=True),

            ConvBlock(256, 256),
            nn.ReflectionPad2d(1),
            nn.Conv2d(256, 256, 3),
            nn.ReLU(inplace=True),
            nn.ReflectionPad2d(1),
            nn.Conv2d(256, 128, 3),
            nn.ReLU(inplace=True),

            ConvBlock(128, 128),
            nn.ReflectionPad2d(1),
            nn.Conv2d(128, 64, 3),
            nn.ReLU(inplace=True),

            ConvBlock(64, out_channels)
        )

    def forward(self, x):
        return self.decoder_layers(x)

    
class AdaINet(nn.Module):
    def __init__(self, path_vgg_weights=None, out_channels=3, device='cpu'):
        super(AdaINet, self).__init__()
        self.encoder = VGGEncoder(path_vgg_weights=path_vgg_weights, device=device)
        self.decoder = Decoder(out_channels=out_channels)

    def forward(self, content, style, alpha=1.0):
        # Encode
        content_feat = self.encoder(content)
        style_feat = self.encoder(style)
        # AdaIN
        t = self.adain(content_feat, style_feat)
        t = alpha * t + (1 - alpha) * content_feat
        # Decode
        generated = self.decoder(t)
        return generated, t

    def adain(self, content_feat, style_feat, eps=1e-5):
        c_mean = torch.mean(content_feat, dim=[2, 3], keepdim=True)
        c_std = torch.std(content_feat, dim=[2, 3], keepdim=True) + eps
        s_mean = torch.mean(style_feat, dim=[2, 3], keepdim=True)
        s_std = torch.std(style_feat, dim=[2, 3], keepdim=True) + eps

        normalized_feat = (content_feat - c_mean) / c_std
        stylized_feat = normalized_feat * s_std + s_mean
        return stylized_feat

    
class VGGEncoderMultiLayer(nn.Module):
    def __init__(self, path_vgg_weights=None, device='cpu'):
        super(VGGEncoderMultiLayer, self).__init__()
        self.device = device
        if path_vgg_weights is None:
            vgg16 = models.vgg16(pretrained=True)
        else:
            vgg16 = models.vgg16()
            vgg16.load_state_dict(torch.load(path_vgg_weights, map_location=device))
        
        self.slice1 = nn.Sequential(*list(vgg16.features.children())[:2])   # relu1_1
        self.slice2 = nn.Sequential(*list(vgg16.features.children())[2:7])  # relu2_1
        self.slice3 = nn.Sequential(*list(vgg16.features.children())[7:14]) # relu3_1
        self.slice4 = nn.Sequential(*list(vgg16.features.children())[14:21]) # relu4_1
        # Freeze weights
        for param in self.parameters():
            param.requires_grad = False

        self.to(device)
        
    def forward(self, x):
        x = x.to(self.device)
        relu1_1 = self.slice1(x)
        relu2_1 = self.slice2(relu1_1)
        relu3_1 = self.slice3(relu2_1)
        relu4_1 = self.slice4(relu3_1)
        return {
            'relu1_1': relu1_1,
            'relu2_1': relu2_1,
            'relu3_1': relu3_1,
            'relu4_1': relu4_1
        }
class AdaINLossMultiLayer(nn.Module):
    def __init__(self, encoder, alpha=1.0, beta=0.5, eps=1e-5):
        super().__init__()
        self.encoder = encoder
        self.alpha = alpha
        self.beta = beta
        self.eps = eps
        self.style_layers = ['relu1_1', 'relu2_1', 'relu3_1', 'relu4_1']

    def calc_mean_std(self, feat):
        B, C = feat.size(0), feat.size(1)
        feat_reshaped = feat.view(B, C, -1)
        mean = feat_reshaped.mean(dim=2).view(B, C, 1, 1)
        std = feat_reshaped.std(dim=2).view(B, C, 1, 1) + self.eps
        return mean, std

    def content_loss(self, gen_feat, t):
        return nn.functional.mse_loss(gen_feat, t)

    def style_loss(self, gen_feat, style_feat):
        loss = 0.0
        for layer in self.style_layers:
            g_mean, g_std = self.calc_mean_std(gen_feat[layer])
            s_mean, s_std = self.calc_mean_std(style_feat[layer])
            loss += nn.functional.mse_loss(g_mean, s_mean) + nn.functional.mse_loss(g_std, s_std)
        return loss

    def forward(self, generated, t, style):
        gen_feat = self.encoder(generated)
        style_feat = self.encoder(style)
        # resize t cho khớp với gen_feat
        t_resized = nn.functional.interpolate(t, size=gen_feat['relu4_1'].shape[2:], mode='nearest')
        c_loss = self.content_loss(gen_feat['relu4_1'], t_resized)
        s_loss = self.style_loss(gen_feat, style_feat)

        total = self.alpha * c_loss + self.beta * s_loss
        return total, c_loss, s_loss