import ExpoModulesCore
import ObjectiveC

public class ExpoKeyEventModule: Module {
  private var keyboardListenerView: KeyboardListenerView?

  public func definition() -> ModuleDefinition {
    Name("ExpoKeyEvent")
    Events("onKeyPress", "onKeyRelease")
    Function("startListening") { [weak self] in
      guard let self = self else { return }

      // We must manipulate UI on the main thread
      DispatchQueue.main.async {
        // If we haven't already added the listener view, create one and add it.
        if self.keyboardListenerView == nil {
          let listenerView = KeyboardListenerView(
            onKeyPress: { key, shift, ctrl, alt, meta, rep in
              self.sendEvent("onKeyPress", [
                  "key": key,
                  "eventType": "press",
                  "shiftKey": shift,
                  "ctrlKey": ctrl,
                  "altKey": alt,
                  "metaKey": meta,
                  "repeat": rep
              ])
            },
            onKeyRelease: { key, shift, ctrl, alt, meta, rep in
              self.sendEvent("onKeyRelease", [
                  "key": key,
                  "eventType": "release",
                  "shiftKey": shift,
                  "ctrlKey": ctrl,
                  "altKey": alt,
                  "metaKey": meta,
                  "repeat": rep
              ])
            }
          )

          #if os(macOS)
            if let window = NSApplication.shared.keyWindow,
             let rootView = window.contentView {
              rootView.addSubview(listenerView)
              window.makeFirstResponder(listenerView)  // crucial for receiving hardware key events
              self.keyboardListenerView = listenerView
            }
          #else
            if let window = UIApplication.shared.delegate?.window,
             let rootView = window?.rootViewController?.view {
              rootView.addSubview(listenerView)
              // No need to become first responder - we intercept at window level via sendEvent
              self.keyboardListenerView = listenerView
            }
          #endif
        }
      }
    }

    Function("stopListening") { [weak self] in
      guard let self = self else { return }

      DispatchQueue.main.async {
        // Remove the listener view if it exists
        self.keyboardListenerView?.removeFromSuperview()
        self.keyboardListenerView = nil
      }
    }
  }
}

/// A custom hidden view that uses event monitors to intercept hardware key events globally.
#if os(macOS)
  class KeyboardListenerView: NSView {
    private let onKeyPress: (String, Bool, Bool, Bool, Bool, Bool) -> Void
    private let onKeyRelease: (String, Bool, Bool, Bool, Bool, Bool) -> Void
    private var keyDownMonitor: Any?
    private var keyUpMonitor: Any?

    init(onKeyPress: @escaping (String, Bool, Bool, Bool, Bool, Bool) -> Void, onKeyRelease: @escaping (String, Bool, Bool, Bool, Bool, Bool) -> Void) {
      self.onKeyPress = onKeyPress
      self.onKeyRelease = onKeyRelease
      super.init(frame: .zero)

      // Hide this view; we only need it to intercept events.
      self.isHidden = true

      // Set up local event monitors to capture key events even when not first responder
      keyDownMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
        guard let self = self else { return event }
        let modifiers = event.modifierFlags
        self.onKeyPress(
          String(event.keyCode),
          modifiers.contains(.shift),
          modifiers.contains(.control),
          modifiers.contains(.option),
          modifiers.contains(.command),
          event.isARepeat
        )
        return event  // Allow the event to continue to other responders
      }

      keyUpMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyUp) { [weak self] event in
        guard let self = self else { return event }
        let modifiers = event.modifierFlags
        self.onKeyRelease(
          String(event.keyCode),
          modifiers.contains(.shift),
          modifiers.contains(.control),
          modifiers.contains(.option),
          modifiers.contains(.command),
          false  // Key up events are never repeats
        )
        return event  // Allow the event to continue to other responders
      }
    }

    required init?(coder: NSCoder) {
      fatalError("init(coder:) has not been implemented")
    }

    deinit {
      // Clean up event monitors
      if let monitor = keyDownMonitor {
        NSEvent.removeMonitor(monitor)
      }
      if let monitor = keyUpMonitor {
        NSEvent.removeMonitor(monitor)
      }
    }

    override var acceptsFirstResponder: Bool {
      return true
    }
  }
#else
  // Storage for the key event handler
  private var keyEventHandlerKey: UInt8 = 0

  // Protocol for handling key events
  @objc protocol KeyEventHandler {
    func handleKeyPress(_ keyCode: String, _ shift: Bool, _ ctrl: Bool, _ alt: Bool, _ meta: Bool, _ repeat: Bool)
    func handleKeyRelease(_ keyCode: String, _ shift: Bool, _ ctrl: Bool, _ alt: Bool, _ meta: Bool)
  }

  // Extension to UIWindow to add key event handling
  extension UIWindow {
    private static var hasSwizzled = false

    var keyEventHandler: KeyEventHandler? {
      get {
        return objc_getAssociatedObject(self, &keyEventHandlerKey) as? KeyEventHandler
      }
      set {
        objc_setAssociatedObject(self, &keyEventHandlerKey, newValue, .OBJC_ASSOCIATION_ASSIGN)
      }
    }

    static func swizzleSendEventIfNeeded() {
      guard !hasSwizzled else { return }
      hasSwizzled = true

      let originalSelector = #selector(UIWindow.sendEvent(_:))
      let swizzledSelector = #selector(UIWindow.expo_sendEvent(_:))

      guard let originalMethod = class_getInstanceMethod(UIWindow.self, originalSelector),
            let swizzledMethod = class_getInstanceMethod(UIWindow.self, swizzledSelector) else {
        return
      }

      method_exchangeImplementations(originalMethod, swizzledMethod)
    }

    @objc dynamic func expo_sendEvent(_ event: UIEvent) {
      // Check if this is a press event and we have a handler
      if let handler = keyEventHandler, let pressesEvent = event as? UIPressesEvent {
        for press in pressesEvent.allPresses {
          guard let key = press.key else { continue }
          let keyCode = String(Int(key.keyCode.rawValue))
          let modifiers = key.modifierFlags

          if press.phase == .began {
            handler.handleKeyPress(
              keyCode,
              modifiers.contains(.shift),
              modifiers.contains(.control),
              modifiers.contains(.alternate),
              modifiers.contains(.command),
              false  // repeat handled by listener
            )
          } else if press.phase == .ended || press.phase == .cancelled {
            handler.handleKeyRelease(
              keyCode,
              modifiers.contains(.shift),
              modifiers.contains(.control),
              modifiers.contains(.alternate),
              modifiers.contains(.command)
            )
          }
        }
      }

      // Call original implementation to continue normal event handling
      self.expo_sendEvent(event)
    }
  }

  class KeyboardListenerView: UIView, KeyEventHandler {
    private let onKeyPress: (String, Bool, Bool, Bool, Bool, Bool) -> Void
    private let onKeyRelease: (String, Bool, Bool, Bool, Bool, Bool) -> Void
    private var pressedKeys = Set<Int>()

    init(onKeyPress: @escaping (String, Bool, Bool, Bool, Bool, Bool) -> Void, onKeyRelease: @escaping (String, Bool, Bool, Bool, Bool, Bool) -> Void) {
      self.onKeyPress = onKeyPress
      self.onKeyRelease = onKeyRelease
      super.init(frame: .zero)

      // Hide this view; we only need it to hook into the window
      self.isHidden = true
      self.isUserInteractionEnabled = false

      // Set up window-level interception
      UIWindow.swizzleSendEventIfNeeded()
    }

    required init?(coder: NSCoder) {
      fatalError("init(coder:) has not been implemented")
    }

    override func didMoveToWindow() {
      super.didMoveToWindow()
      if let window = self.window {
        window.keyEventHandler = self
      }
    }

    override func willMove(toWindow newWindow: UIWindow?) {
      if newWindow == nil, let window = self.window {
        window.keyEventHandler = nil
      }
      super.willMove(toWindow: newWindow)
    }

    // KeyEventHandler implementation
    @objc func handleKeyPress(_ keyCode: String, _ shift: Bool, _ ctrl: Bool, _ alt: Bool, _ meta: Bool, _ repeat: Bool) {
      guard let keyCodeInt = Int(keyCode) else { return }

      // Check if this is a repeat
      let isRepeat = pressedKeys.contains(keyCodeInt)
      pressedKeys.insert(keyCodeInt)

      onKeyPress(keyCode, shift, ctrl, alt, meta, isRepeat)
    }

    @objc func handleKeyRelease(_ keyCode: String, _ shift: Bool, _ ctrl: Bool, _ alt: Bool, _ meta: Bool) {
      guard let keyCodeInt = Int(keyCode) else { return }
      pressedKeys.remove(keyCodeInt)

      onKeyRelease(keyCode, shift, ctrl, alt, meta, false)
    }
  }
#endif
