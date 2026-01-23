
import Phaser from 'phaser';
import { errorOverlay } from '../utils/errors';

// 存在しないリソースの検知（load失敗時は警告して続行）
export class ResourceManager {
  static image(scene: Phaser.Scene, key: string) {
    const k = key;
    if (scene.textures.exists(k)) return;
    scene.load.image(k, k);
    scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: any) => {
      if (file && file.key === k) {
        errorOverlay.warn(`画像の読み込み失敗: ${k}`);
      }
    });
  }
}
