import { useEvent } from "expo";
import { useEffect, useMemo } from "react";
import { DevSettings } from "react-native";

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
  const pressEvent = useEvent(ExpoKeyEventModule, "onKeyPress");
  const releaseEvent = useEvent(ExpoKeyEventModule, "onKeyRelease");

  useEffect(() => {
    if (listenOnMount) ExpoKeyEventModule.startListening();

    return () => {
      ExpoKeyEventModule.stopListening();
    };
  }, [listenOnMount]);

  const keyEvent = useMemo(() => {
    if (!pressEvent) return null;
    const uniKey = unifyKeyCode(pressEvent.key);
    if (!preventReload && __DEV__ && uniKey === "KeyR") DevSettings.reload();

    // Build base event
    const event: any = {
      key: uniKey,
      eventType: "press" as const,
    };

    // Conditionally add modifiers
    if (captureModifiers) {
      event.shiftKey = pressEvent.shiftKey ?? false;
      event.ctrlKey = pressEvent.ctrlKey ?? false;
      event.altKey = pressEvent.altKey ?? false;
      event.metaKey = pressEvent.metaKey ?? false;
      event.repeat = pressEvent.repeat ?? false;
    }

    return event;
  }, [pressEvent, preventReload, captureModifiers]);

  const keyReleaseEvent = useMemo(() => {
    if (!listenToRelease || !releaseEvent) return null;
    const uniKey = unifyKeyCode(releaseEvent.key);

    const event: any = {
      key: uniKey,
      eventType: "release" as const,
    };

    if (captureModifiers) {
      event.shiftKey = releaseEvent.shiftKey ?? false;
      event.ctrlKey = releaseEvent.ctrlKey ?? false;
      event.altKey = releaseEvent.altKey ?? false;
      event.metaKey = releaseEvent.metaKey ?? false;
      event.repeat = releaseEvent.repeat ?? false;
    }

    return event;
  }, [releaseEvent, listenToRelease, captureModifiers]);

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
