import os
import torch
from tqdm import tqdm
from torchvision.utils import save_image

def train_model(
    train_loader, test_loader,
    model, criterion, optimizer,
    device, num_epochs,
    save_dir="../checkpoints"
):
    os.makedirs(save_dir, exist_ok=True)

    # ====================== LOAD CHECKPOINT ======================
    checkpoint_path = os.path.join(save_dir, "latest_checkpoint.pth")
    start_epoch = 0
    best_val_loss = float("inf")

    if os.path.exists(checkpoint_path):
        print(f"🔄 Loading checkpoint from {checkpoint_path}")
        ckpt = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(ckpt["model"])
        optimizer.load_state_dict(ckpt["optimizer"])
        start_epoch = ckpt["epoch"] + 1
        best_val_loss = ckpt["best_val_loss"]
        print(f"➡ Continue from epoch {start_epoch}, best_val_loss={best_val_loss:.4f}")

    # ====================== TRAIN LOOP ======================
    for epoch in range(start_epoch, num_epochs):
        model.train()
        running_loss = 0.0
        pbar = tqdm(train_loader, desc=f"Epoch {epoch} Training")

        for content, style in pbar:
            content, style = content.to(device), style.to(device)

            optimizer.zero_grad()
            generated, t = model(content, style)
            loss, c_loss, s_loss = criterion(generated, t, style)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            pbar.set_postfix({
                "Loss": f"{loss.item():.4f}",
                "Content": f"{c_loss.item():.4f}",
                "Style": f"{s_loss.item():.4f}",
            })

        avg_train_loss = running_loss / len(train_loader)

        # ====================== VALIDATION ======================
        model.eval()
        val_loss = 0.0
        sample_saved = False

        with torch.no_grad():
            for batch_idx, (content, style) in enumerate(test_loader):
                content, style = content.to(device), style.to(device)
                generated, target_feat = model(content, style)
                loss, _, _ = criterion(generated, target_feat, style)
                val_loss += loss.item()

                if not sample_saved:
                    img_path = os.path.join(save_dir, f"epoch_{epoch}_sample.png")
                    save_image(generated.clamp(0,1), img_path)
                    sample_saved = True

        avg_val_loss = val_loss / len(test_loader)
        print(f"✅ Epoch {epoch} | Train: {avg_train_loss:.4f} | Val: {avg_val_loss:.4f}")

        # ====================== SAVE BEST MODEL ======================
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            best_path = os.path.join(save_dir, "best_model.pth")
            torch.save(model.state_dict(), best_path)
            print(f"🏆 Best model updated! Saved: {best_path}")

        # ====================== SAVE CHECKPOINT (Resume) ======================
        torch.save({
            "epoch": epoch,
            "model": model.state_dict(),
            "optimizer": optimizer.state_dict(),
            "best_val_loss": best_val_loss,
        }, checkpoint_path)

    print("🎯 Training Completed!")
    return best_val_loss