import { useEvent } from "expo";
import { useEffect, useMemo } from "react";
import { DevSettings } from "react-native";

import ExpoKeyEventModule from "../ExpoKeyEventModule";
import { unifyKeyCode } from "../utils/unifyKeyCode";

/**
 *
 * @param listenOnMount Pass 'false' to prevent automatic key event listening
 * - Use startListening/stopListening to control the listener manually
 * @param preventReload Prevent reloading the app when pressing 'r'
 * @param listenToRelease Pass 'true' to enable onKeyRelease events (defaults to false for backward compatibility)
 * @returns
 *
 */
export function useKeyEvent(
  listenOnMount = true,
  preventReload = false,
  listenToRelease = false,
) {
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
    return {
      key: uniKey,
    };
  }, [pressEvent, preventReload]);

  const keyReleaseEvent = useMemo(() => {
    if (!listenToRelease || !releaseEvent) return null;
    const uniKey = unifyKeyCode(releaseEvent.key);
    return {
      key: uniKey,
    };
  }, [releaseEvent, listenToRelease]);

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
