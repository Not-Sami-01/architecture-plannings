"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { PACKAGE_IMAGE } from "@/config/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Output size/aspect config — PACKAGE_IMAGE today, BLOG_COVER for blog covers. */
export type CropDialogConfig = {
  width: number;
  height: number;
  aspect: number;
  recommended: string;
};

type ImageCropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Object URL of the source image the user picked. */
  src: string;
  /** Receives the cropped image at the config's dimensions. */
  onCropped: (blob: Blob) => void | Promise<void>;
  title?: string;
  /** Defaults to the pricing-card config (4:3, 1200×900). */
  config?: CropDialogConfig;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read the image."));
    image.src = src;
  });
}

/** Draws exactly the cropped region at the given output size (JPEG q0.92). */
async function cropToBlob(src: string, pixels: Area, config: CropDialogConfig): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.drawImage(
    image,
    pixels.x,
    pixels.y,
    pixels.width,
    pixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );
  if (!blob) throw new Error("Could not process the image.");
  return blob;
}

/**
 * Fixed-aspect crop step between "file picked" and "upload" (plan 5 A). The
 * config locks the aspect and output size so every card/cover has an
 * identical image band; the recommended size is shown so admins can prepare
 * the right source file.
 */
export function ImageCropDialog({
  open,
  onOpenChange,
  src,
  onCropped,
  title = "Crop image",
  config = PACKAGE_IMAGE,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Base UI unmounts the popup on close, so crop/zoom/applying state is fresh
  // on every open — no reset effect needed (and none allowed: no setState in
  // effects, per the compiler lint rule).
  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const apply = async () => {
    if (!croppedAreaPixels || applying) return;
    setApplying(true);
    setError(null);
    try {
      const blob = await cropToBlob(src, croppedAreaPixels, config);
      await onCropped(blob);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process the image.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Drag to reposition, then zoom until the subject fits. Output is fixed at{" "}
            {config.width} × {config.height} px.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[46svh] min-h-[260px] w-full overflow-hidden rounded-lg bg-muted">
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={config.aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : null}
        </div>

        <label className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="h-11 flex-1 accent-primary"
            aria-label="Zoom"
          />
        </label>

        <p className="text-xs text-muted-foreground">{config.recommended}</p>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={applying}
          >
            Cancel
          </Button>
          <Button type="button" onClick={apply} disabled={!croppedAreaPixels || applying}>
            {applying ? "Processing…" : "Use image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
