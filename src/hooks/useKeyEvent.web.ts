import { useCallback, useEffect, useState } from "react";

import { KeyPressEvent, KeyReleaseEvent } from "../ExpoKeyEvent.types";

export interface UseKeyEventOptions {
  /**
   * Pass 'false' to prevent automatic key event listening
   * - Use startListening/stopListening to control the listener manually
   * @default true
   */
  listenOnMount?: boolean;
  /**
   * Prevent reloading the app when pressing 'r' (not applicable on web)
   * @default false
   */
  preventReload?: boolean;
  /**
   * Pass 'true' to enable onKeyRelease events (defaults to false for backward compatibility)
   * @default false
   */
  listenToRelease?: boolean;
  /**
   * Pass 'true' to capture modifier keys (shift, ctrl, alt, meta) and repeat flag
   * @default false
   */
  captureModifiers?: boolean;
}

// New API - options object
export function useKeyEvent(
  options?: UseKeyEventOptions,
): ReturnType<typeof useKeyEventImpl>;
/**
 * Legacy API - positional parameters (for backwards compatibility)
 * @deprecated Use `useKeyEvent(
  options?: UseKeyEventOptions
)` instead
 */
export function useKeyEvent(
  listenOnMount?: boolean,
  preventReload?: boolean,
  listenToRelease?: boolean,
): ReturnType<typeof useKeyEventImpl>;

export function useKeyEvent(
  optionsOrListenOnMount?: UseKeyEventOptions | boolean,
  preventReload?: boolean,
  listenToRelease?: boolean,
) {
  // Backwards compatibility: detect if using old API (boolean) or new API (object/undefined)
  let options: UseKeyEventOptions;

  if (typeof optionsOrListenOnMount === "boolean") {
    // Legacy API: positional parameters (boolean explicitly passed)
    options = {
      listenOnMount: optionsOrListenOnMount,
      preventReload: preventReload ?? false,
      listenToRelease: listenToRelease ?? false,
    };
  } else {
    // New API: options object or undefined (defaults to {})
    options = optionsOrListenOnMount ?? {};
  }

  return useKeyEventImpl(options);
}

function useKeyEventImpl({
  listenOnMount = true,
  preventReload = false,
  listenToRelease = false,
  captureModifiers = false,
}: UseKeyEventOptions) {
  const [keyEvent, setKeyEvent] = useState<KeyPressEvent | null>(null);
  const [keyReleaseEvent, setKeyReleaseEvent] =
    useState<KeyReleaseEvent | null>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Build properly typed event
      const pressEvent: KeyPressEvent = {
        key: event.code,
        character: event.key.length === 1 ? event.key : undefined,
        eventType: "press" as const,
        // Conditionally include modifiers
        ...(captureModifiers && {
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          repeat: event.repeat,
        }),
      };

      setKeyEvent(pressEvent);
    },
    [captureModifiers],
  );

  const onKeyUp = useCallback(
    (event: KeyboardEvent) => {
      // Build properly typed event
      const releaseEvent: KeyReleaseEvent = {
        key: event.code,
        character: event.key.length === 1 ? event.key : undefined,
        eventType: "release" as const,
        // Conditionally include modifiers
        ...(captureModifiers && {
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          repeat: false, // Key up events are never repeats
        }),
      };

      setKeyReleaseEvent(releaseEvent);
    },
    [captureModifiers],
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
    keyEvent,
    keyReleaseEvent,
  };
}
