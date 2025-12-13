package expo.modules.keyevent

import android.content.Context
import android.view.KeyEvent
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class ExpoKeyEventView(
  context: Context,
  appContext: AppContext,
  private val onKeyPress: (Map<String, Any>) -> Unit,
  private val onKeyRelease: (Map<String, Any>) -> Unit
) : ExpoView(context, appContext) {

  init {
    // Allows the view to receive key events.
    isFocusable = true
    isFocusableInTouchMode = true

    // Optionally request focus immediately, if desired.
    // requestFocus()
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    event?.let { e ->
      // Send all key events (including repeats) with accurate repeat flag
      onKeyPress(mapOf(
        "key" to keyCode.toString(),
        "shiftKey" to e.isShiftPressed,
        "ctrlKey" to e.isCtrlPressed,
        "altKey" to e.isAltPressed,
        "metaKey" to e.isMetaPressed,
        "repeat" to (e.repeatCount > 0)
      ))
    }
    return super.onKeyDown(keyCode, event)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
    event?.let { e ->
      onKeyRelease(mapOf(
        "key" to keyCode.toString(),
        "shiftKey" to e.isShiftPressed,
        "ctrlKey" to e.isCtrlPressed,
        "altKey" to e.isAltPressed,
        "metaKey" to e.isMetaPressed,
        "repeat" to false  // Key up events are never repeats
      ))
    }
    return super.onKeyUp(keyCode, event)
  }
}
