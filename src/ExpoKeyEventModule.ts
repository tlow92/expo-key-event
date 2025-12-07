import { NativeModule, requireNativeModule } from "expo";

import { ExpoKeyEventModuleEvents } from "./ExpoKeyEvent.types";

declare class ExpoKeyEventModule extends NativeModule<ExpoKeyEventModuleEvents> {
  startListening(): void;
  stopListening(): void;
}

let Module: ReturnType<typeof requireNativeModule<ExpoKeyEventModule>>;
try {
  Module = requireNativeModule<ExpoKeyEventModule>("ExpoKeyEvent");
} catch (e) {
  console.error(e);
  throw new Error(
    "ExpoKeyEventModule not available. Make sure you are not using Expo Go. Check https://github.com/tlow92/expo-key-event?tab=readme-ov-file#error-cannot-find-native-module-expokeyevent for more information.",
  );
}

export default Module;
