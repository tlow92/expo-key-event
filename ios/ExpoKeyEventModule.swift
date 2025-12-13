import ExpoModulesCore

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
              listenerView.becomeFirstResponder()  // crucial for receiving hardware key events
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

/// A custom hidden view that can become first responder and intercept hardware key events.
#if os(macOS)
  class KeyboardListenerView: NSView {
    private let onKeyPress: (String, Bool, Bool, Bool, Bool, Bool) -> Void
    private let onKeyRelease: (String, Bool, Bool, Bool, Bool, Bool) -> Void

    init(onKeyPress: @escaping (String, Bool, Bool, Bool, Bool, Bool) -> Void, onKeyRelease: @escaping (String, Bool, Bool, Bool, Bool, Bool) -> Void) {
      self.onKeyPress = onKeyPress
      self.onKeyRelease = onKeyRelease
      super.init(frame: .zero)

      // Hide this view; we only need it to intercept events.
      self.isHidden = true
    }

    required init?(coder: NSCoder) {
      fatalError("init(coder:) has not been implemented")
    }

    override var acceptsFirstResponder: Bool {
      return true
    }

    override func keyDown(with event: NSEvent) {
      let modifiers = event.modifierFlags
      onKeyPress(
        String(event.keyCode),
        modifiers.contains(.shift),
        modifiers.contains(.control),
        modifiers.contains(.option),
        modifiers.contains(.command),
        event.isARepeat
      )
    }

    override func keyUp(with event: NSEvent) {
      let modifiers = event.modifierFlags
      onKeyRelease(
        String(event.keyCode),
        modifiers.contains(.shift),
        modifiers.contains(.control),
        modifiers.contains(.option),
        modifiers.contains(.command),
        false  // Key up events are never repeats
      )
    }
  }
#else
  class KeyboardListenerView: UIView {
    private let onKeyPress: (String, Bool, Bool, Bool, Bool, Bool) -> Void
    private let onKeyRelease: (String, Bool, Bool, Bool, Bool, Bool) -> Void
    private var pressedKeys = Set<Int>()

    init(onKeyPress: @escaping (String, Bool, Bool, Bool, Bool, Bool) -> Void, onKeyRelease: @escaping (String, Bool, Bool, Bool, Bool, Bool) -> Void) {
      self.onKeyPress = onKeyPress
      self.onKeyRelease = onKeyRelease
      super.init(frame: .zero)

      // Hide this view; we only need it to intercept events.
      self.isHidden = true
      self.isUserInteractionEnabled = true
    }

    required init?(coder: NSCoder) {
      fatalError("init(coder:) has not been implemented")
    }

    override var canBecomeFirstResponder: Bool {
      return true
    }

    override func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
      super.pressesBegan(presses, with: event)
      guard let press = presses.first,
            let key = press.key else { return }

      let keyCode = Int(key.keyCode.rawValue)

      // Check if this key is already pressed (repeat event)
      let isRepeat = pressedKeys.contains(keyCode)

      // Add to pressed keys set
      pressedKeys.insert(keyCode)

      // Get modifier flags from the key
      let modifiers = key.modifierFlags
      onKeyPress(
        String(keyCode),
        modifiers.contains(.shift),
        modifiers.contains(.control),
        modifiers.contains(.alternate),
        modifiers.contains(.command),
        isRepeat
      )
      return
    }

    override func pressesEnded(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
      super.pressesEnded(presses, with: event)
      guard let press = presses.first,
            let key = press.key else { return }

      let keyCode = Int(key.keyCode.rawValue)

      // Remove from pressed keys set
      pressedKeys.remove(keyCode)

      let modifiers = key.modifierFlags
      onKeyRelease(
        String(keyCode),
        modifiers.contains(.shift),
        modifiers.contains(.control),
        modifiers.contains(.alternate),
        modifiers.contains(.command),
        false  // Key up events are never repeats
      )
      return
    }
  }
#endif
