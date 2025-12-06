// Base event type (future-ready for modifier keys)
type KeyEventBase = {
  key: string;
  // Future: shiftKey?: boolean;
  // Future: ctrlKey?: boolean;
  // Future: metaKey?: boolean;
  // Future: altKey?: boolean;
};

// Event type for key press (unchanged for backward compatibility)
export type KeyPressEvent = KeyEventBase;

// Event type for key release
export type KeyReleaseEvent = KeyEventBase;

// Combined type for internal use
export type KeyEvent = KeyPressEvent | KeyReleaseEvent;

export type ExpoKeyEventModuleEvents = {
  onKeyPress: (event: KeyPressEvent) => void;
  onKeyRelease: (event: KeyReleaseEvent) => void;
};
