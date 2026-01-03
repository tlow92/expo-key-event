// Base event type with modifier key support
type KeyEventBase = {
  key: string;
  character?: string | null;
  eventType: "press" | "release";
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  repeat?: boolean;
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
