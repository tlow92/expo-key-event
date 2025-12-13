import { useEventListener } from "expo";
import { useCallback, useEffect } from "react";
import { DevSettings } from "react-native";

import { KeyPressEvent, KeyReleaseEvent } from "../ExpoKeyEvent.types";
import ExpoKeyEventModule from "../ExpoKeyEventModule";
import { unifyKeyCode } from "../utils/unifyKeyCode";

export interface UseKeyEventListenerOptions {
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

// New API - listener + options object
export function useKeyEventListener(
  listener: (event: KeyPressEvent | KeyReleaseEvent) => void,
  options?: UseKeyEventListenerOptions,
): ReturnType<typeof useKeyEventListenerImpl>;
/**
 * Legacy API - listener + positional parameters (for backwards compatibility)
 * @deprecated Use `useKeyEvent(
  options?: UseKeyEventOptions
)` instead
 */
export function useKeyEventListener(
  listener: (event: KeyPressEvent | KeyReleaseEvent) => void,
  listenOnMount?: boolean,
  preventReload?: boolean,
  listenToRelease?: boolean,
): ReturnType<typeof useKeyEventListenerImpl>;

export function useKeyEventListener(
  listener: (event: KeyPressEvent | KeyReleaseEvent) => void,
  optionsOrListenOnMount?: UseKeyEventListenerOptions | boolean,
  preventReload?: boolean,
  listenToRelease?: boolean,
) {
  // Backwards compatibility: detect if using old API (boolean) or new API (object/undefined)
  let options: UseKeyEventListenerOptions;

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

  return useKeyEventListenerImpl(listener, options);
}

function useKeyEventListenerImpl(
  listener: (event: KeyPressEvent | KeyReleaseEvent) => void,
  {
    listenOnMount = true,
    preventReload = false,
    listenToRelease = false,
    captureModifiers = false,
  }: UseKeyEventListenerOptions,
) {
  const onKeyPress = useCallback(
    (rawEvent: KeyPressEvent) => {
      const uniKey = unifyKeyCode(rawEvent.key);
      if (!preventReload && __DEV__ && uniKey === "KeyR") DevSettings.reload();

      const event: any = {
        key: uniKey,
        eventType: "press",
      };

      if (captureModifiers) {
        event.shiftKey = rawEvent.shiftKey ?? false;
        event.ctrlKey = rawEvent.ctrlKey ?? false;
        event.altKey = rawEvent.altKey ?? false;
        event.metaKey = rawEvent.metaKey ?? false;
        event.repeat = rawEvent.repeat ?? false;
      }

      listener(event);
    },
    [listener, preventReload, captureModifiers],
  );

  const onKeyRelease = useCallback(
    (rawEvent: KeyReleaseEvent) => {
      const uniKey = unifyKeyCode(rawEvent.key);

      const event: any = {
        key: uniKey,
        eventType: "release",
      };

      if (captureModifiers) {
        event.shiftKey = rawEvent.shiftKey ?? false;
        event.ctrlKey = rawEvent.ctrlKey ?? false;
        event.altKey = rawEvent.altKey ?? false;
        event.metaKey = rawEvent.metaKey ?? false;
        event.repeat = rawEvent.repeat ?? false;
      }

      listener(event);
    },
    [listener, captureModifiers],
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
  };
}
