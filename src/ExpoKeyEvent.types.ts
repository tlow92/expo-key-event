// Base event type (future-ready for modifier keys)
type KeyEventBase = {
  key: string;
  eventType: "press" | "release";
  // Future: shiftKey?: boolean;
  // Future: ctrlKey?: boolean;
  // Future: metaKey?: boolean;
  // Future: altKey?: boolean;
};

// Event type for key press (unchanged for backward compatibility)
export type KeyPressEvent = KeyEventBase & { eventType: "press" };

// Event type for key release
export type KeyReleaseEvent = KeyEventBase & { eventType: "release" };

// Combined type for internal use
export type KeyEvent = KeyPressEvent | KeyReleaseEvent;

export type ExpoKeyEventModuleEvents = {
  onKeyPress: (event: KeyPressEvent) => void;
  onKeyRelease: (event: KeyReleaseEvent) => void;
};
