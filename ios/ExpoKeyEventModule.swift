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
            onKeyPress: { key in
              self.sendEvent("onKeyPress", [
                  "key": key,
                  "eventType": "press"
              ])
            },
            onKeyRelease: { key in
              self.sendEvent("onKeyRelease", [
                  "key": key,
                  "eventType": "release"
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
    private let onKeyPress: (String) -> Void
    private let onKeyRelease: (String) -> Void

    init(onKeyPress: @escaping (String) -> Void, onKeyRelease: @escaping (String) -> Void) {
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
      onKeyPress(String(event.keyCode))
    }

    override func keyUp(with event: NSEvent) {
      onKeyRelease(String(event.keyCode))
    }
  }
#else
  class KeyboardListenerView: UIView {
    private let onKeyPress: (String) -> Void
    private let onKeyRelease: (String) -> Void

    init(onKeyPress: @escaping (String) -> Void, onKeyRelease: @escaping (String) -> Void) {
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
      guard let uiKey = presses.first?.key else { return }

      onKeyPress(String(uiKey.keyCode.rawValue))
      return
    }

    override func pressesEnded(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
      super.pressesEnded(presses, with: event)
      guard let uiKey = presses.first?.key else { return }

      onKeyRelease(String(uiKey.keyCode.rawValue))
      return
    }
  }
#endif
