import { useEventListener } from "expo";
import { useCallback, useEffect } from "react";
import { DevSettings } from "react-native";

import { KeyPressEvent, KeyReleaseEvent } from "../ExpoKeyEvent.types";
import ExpoKeyEventModule from "../ExpoKeyEventModule";
import { unifyKeyCode } from "../utils/unifyKeyCode";

/**
 * This hook is used to listen for key events, but it doesn't keep the track of it.
 * This is useful if you want to handle the state yourself or use the event outside of the react lifecycle.
 * @param listenOnMount Pass 'false' to prevent automatic key event listening
 * - Use startListening/stopListening to control the listener manually
 * @param preventReload Prevent reloading the app when pressing 'r'
 * @param listenToRelease Pass 'true' to enable onKeyRelease events (defaults to false for backward compatibility)
 *
 */
export function useKeyEventListener(
  listener: (event: KeyPressEvent | KeyReleaseEvent) => void,
  listenOnMount = true,
  preventReload = false,
  listenToRelease = false,
) {
  const onKeyPress = useCallback(
    ({ key }: KeyPressEvent) => {
      const uniKey = unifyKeyCode(key);
      if (!preventReload && __DEV__ && uniKey === "KeyR") DevSettings.reload();

      listener({ key: uniKey, eventType: "press" });
    },
    [listener, preventReload],
  );

  const onKeyRelease = useCallback(
    ({ key }: KeyReleaseEvent) => {
      const uniKey = unifyKeyCode(key);
      listener({ key: uniKey, eventType: "release" });
    },
    [listener],
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
