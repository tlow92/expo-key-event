import { useCallback, useEffect, useState } from "react";

import { KeyPressEvent, KeyReleaseEvent } from "../ExpoKeyEvent.types";

/**
 *
 * @param listenOnMount Pass 'false' to prevent automatic key event listening
 * - Use startListening/stopListening to control the listener manually
 * @param listenToRelease Pass 'true' to enable onKeyRelease events (defaults to false for backward compatibility)
 * @returns
 *
 */
export function useKeyEvent(listenOnMount = true, listenToRelease = false) {
  const [keyEvent, setKeyEvent] = useState<KeyPressEvent | null>(null);
  const [keyReleaseEvent, setKeyReleaseEvent] =
    useState<KeyReleaseEvent | null>(null);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    setKeyEvent({ key: event.code });
  }, []);

  const onKeyUp = useCallback((event: KeyboardEvent) => {
    setKeyReleaseEvent({ key: event.code });
  }, []);

  const startListening = useCallback(() => {
    addEventListener("keydown", onKeyDown);
    if (listenToRelease) {
      addEventListener("keyup", onKeyUp);
    }
  }, [onKeyDown, onKeyUp, listenToRelease]);

  const stopListening = useCallback(() => {
    removeEventListener("keydown", onKeyDown);
    if (listenToRelease) {
      removeEventListener("keyup", onKeyUp);
    }
  }, [onKeyDown, onKeyUp, listenToRelease]);

  useEffect(() => {
    if (listenOnMount) startListening();
    return () => {
      stopListening();
    };
  }, [listenOnMount, startListening, stopListening]);

  return {
    /**
     * Start listening for key events
     */
    startListening,
    /**
     * Stop listening for key events
     */
    stopListening,
    keyEvent,
    keyReleaseEvent,
  };
}
