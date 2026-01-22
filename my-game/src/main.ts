
import { createGame } from './game';

// Vite HMR でエラーを見やすく
try {
  createGame();
} catch (e) {
  console.error(e);
}
