import type { KeyboardEvent as ReactKeyboardEvent } from "react";

/**
 * 日本語 IME 変換中の Enter は無視し、確定後の Enter のみ処理する。
 */
export function isImeComposing(event: ReactKeyboardEvent): boolean {
  if (event.nativeEvent.isComposing) {
    return true;
  }
  // Chromium: 変換確定前の一部キーで keyCode 229
  if ("keyCode" in event.nativeEvent && event.nativeEvent.keyCode === 229) {
    return true;
  }
  return false;
}
