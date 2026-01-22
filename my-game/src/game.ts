
import Phaser from 'phaser';
import { SCREEN } from './constants';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';

export function createGame(): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: SCREEN.WIDTH,
    height: SCREEN.HEIGHT,
    backgroundColor: '#000000',
    parent: 'app',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: SCREEN.WIDTH,
      height: SCREEN.HEIGHT,
    },
    input: {
      mouse: {
        target: 'app'
      },
      touch: {
        target: 'app'
      }
    },
    audio: {
      // Web Audio APIを使用
      disableWebAudio: false
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 }, debug: false,
      }
    },
    scene: [BootScene, TitleScene, GameScene, ResultScene],
  };
  return new Phaser.Game(config);
}
