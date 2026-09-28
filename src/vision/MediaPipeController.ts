export type GestureName = 'Open_Palm' | 'Closed_Fist' | 'Pointing_Up' | 'Victory' | 'ILoveYou' | 'Thumb_Up' | 'Thumb_Down';

export interface GestureResult {
  name: GestureName | string;
  score: number;
}

/**
 * Fondasi integrasi MediaPipe. Tidak meminta kamera secara otomatis.
 * Game utama tetap dapat dimainkan sepenuhnya tanpa kamera.
 */
export class MediaPipeController {
  private stream: MediaStream | null = null;

  get active() { return Boolean(this.stream); }

  async requestCamera(video: HTMLVideoElement) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Kamera tidak tersedia pada browser ini.');
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = this.stream;
    await video.play();
  }

  stop() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
