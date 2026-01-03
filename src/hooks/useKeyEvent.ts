import { useEventListener } from "expo";
import { useCallback, useEffect, useState } from "react";
import { DevSettings } from "react-native";

import { KeyPressEvent, KeyReleaseEvent } from "../ExpoKeyEvent.types";
import ExpoKeyEventModule from "../ExpoKeyEventModule";
import { unifyKeyCode } from "../utils/unifyKeyCode";

export interface UseKeyEventOptions {
  /**
   * Pass 'false' to prevent automatic key event listening
   * - Use startListening/stopListening to control the listener manually
   * @default true
   */
  listenOnMount?: boolean;
  /**
   * Prevent reloading the app when pressing 'r'
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

  const onKeyPress = useCallback(
    (rawEvent: KeyPressEvent) => {
      const uniKey = unifyKeyCode(rawEvent.key);
      if (!preventReload && __DEV__ && uniKey === "KeyR") DevSettings.reload();

      // Build properly typed event
      const event: KeyPressEvent = {
        key: uniKey,
        character: rawEvent.character,
        eventType: "press" as const,
        // Conditionally include modifiers
        ...(captureModifiers && {
          shiftKey: rawEvent.shiftKey ?? false,
          ctrlKey: rawEvent.ctrlKey ?? false,
          altKey: rawEvent.altKey ?? false,
          metaKey: rawEvent.metaKey ?? false,
          repeat: rawEvent.repeat ?? false,
        }),
      };

      setKeyEvent(event);
    },
    [preventReload, captureModifiers],
  );

  const onKeyRelease = useCallback(
    (rawEvent: KeyReleaseEvent) => {
      const uniKey = unifyKeyCode(rawEvent.key);

      // Build properly typed event
      const event: KeyReleaseEvent = {
        key: uniKey,
        character: rawEvent.character,
        eventType: "release" as const,
        // Conditionally include modifiers
        ...(captureModifiers && {
          shiftKey: rawEvent.shiftKey ?? false,
          ctrlKey: rawEvent.ctrlKey ?? false,
          altKey: rawEvent.altKey ?? false,
          metaKey: rawEvent.metaKey ?? false,
          repeat: rawEvent.repeat ?? false,
        }),
      };

      setKeyReleaseEvent(event);
    },
    [captureModifiers],
  );

  useEventListener(ExpoKeyEventModule, "onKeyPress", onKeyPress);
  useEventListener(
    ExpoKeyEventModule,
    "onKeyRelease",
    listenToRelease ? onKeyRelease : () => {},
  );

  useEffect(() => {
    if (listenOnMount) ExpoKeyEventModule.startListening();

    return () => {
      ExpoKeyEventModule.stopListening();
    };
  }, [listenOnMount]);

  return {
    /**
     * Start listening for key events
     */
    startListening: ExpoKeyEventModule.startListening,
    /**
     * Stop listening for key events
     */
    stopListening: ExpoKeyEventModule.stopListening,
    keyEvent,
    keyReleaseEvent,
  };
}
