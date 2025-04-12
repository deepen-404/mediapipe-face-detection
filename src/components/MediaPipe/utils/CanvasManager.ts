// utils/CanvasManager.ts
import { RefObject } from 'react';

export interface DrawOptions {
  clearCanvas?: boolean;
  drawVideo?: boolean;
}

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private video: HTMLVideoElement;
  private ctx: CanvasRenderingContext2D | null;

  constructor(
    canvasRef: RefObject<HTMLCanvasElement | null>,
    videoRef: RefObject<HTMLVideoElement | null>
  ) {
    if (!canvasRef.current || !videoRef.current) {
      throw new Error('Canvas or video reference not available');
    }

    this.canvas = canvasRef.current;
    this.video = videoRef.current;
    this.ctx = this.canvas.getContext('2d');
  }

  prepare(
    options: DrawOptions = { clearCanvas: true, drawVideo: true }
  ): boolean {
    if (!this.ctx) return false;

    // Ensure canvas dimensions match video
    this.updateDimensions();

    // Clear the canvas if requested
    if (options.clearCanvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw the video frame if requested
    if (
      options.drawVideo &&
      this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      this.ctx.drawImage(
        this.video,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    }

    return true;
  }

  // Update canvas dimensions to match video
  updateDimensions(): void {
    if (
      this.canvas.width !== this.video.videoWidth ||
      this.canvas.height !== this.video.videoHeight
    ) {
      this.canvas.width = this.video.videoWidth || this.canvas.width;
      this.canvas.height = this.video.videoHeight || this.canvas.height;
    }
  }

  // Get canvas context for direct drawing
  getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  // Get canvas element
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  // Get current dimensions
  getDimensions(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }
}
