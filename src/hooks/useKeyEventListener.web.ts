import { useCallback, useEffect } from "react";

import { KeyPressEvent, KeyReleaseEvent } from "../ExpoKeyEvent.types";

/**
 *
 * @param listenOnMount Pass 'false' to prevent automatic key event listening
 * - Use startListening/stopListening to control the listener manually
 * @param listenToRelease Pass 'true' to enable onKeyRelease events (defaults to false for backward compatibility)
 * @returns
 *
 */
export function useKeyEventListener(
  listener: (event: KeyPressEvent | KeyReleaseEvent) => void,
  listenOnMount = true,
  listenToRelease = false,
) {
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => listener({ key: event.code }),
    [listener],
  );

  const onKeyUp = useCallback(
    (event: KeyboardEvent) => listener({ key: event.code }),
    [listener],
  );

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
  };
}
