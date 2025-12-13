package expo.modules.keyevent

import android.content.Context
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

// Interface for handling key events
interface KeyEventHandler {
  fun handleKeyDown(keyCode: Int, event: KeyEvent)
  fun handleKeyUp(keyCode: Int, event: KeyEvent)
}

class ExpoKeyEventView(
  context: Context,
  appContext: AppContext,
  private val onKeyPress: (Map<String, Any>) -> Unit,
  private val onKeyRelease: (Map<String, Any>) -> Unit
) : ExpoView(context, appContext), KeyEventHandler {

  companion object {
    // Global reference to current listener
    @Volatile
    private var currentHandler: KeyEventHandler? = null

    // Static methods to dispatch to current handler
    @JvmStatic
    fun dispatchKeyDown(keyCode: Int, event: KeyEvent) {
      currentHandler?.handleKeyDown(keyCode, event)
    }

    @JvmStatic
    fun dispatchKeyUp(keyCode: Int, event: KeyEvent) {
      currentHandler?.handleKeyUp(keyCode, event)
    }
  }

  init {
    // This view doesn't need to be visible or focusable
    isClickable = false
    isFocusable = false
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    // Set this as the current handler
    currentHandler = this
    // Set up window-level interception
    setupWindowInterception()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    // Clear if we're the current handler
    if (currentHandler == this) {
      currentHandler = null
    }
    removeWindowInterception()
  }

  private fun setupWindowInterception() {
    // Get the DecorView (root view of the window)
    var parent = this.parent
    while (parent != null && parent !is ViewGroup) {
      parent = parent.parent
    }

    val rootView = parent as? ViewGroup ?: return

    // Walk up to find the actual DecorView
    var decorView = rootView
    while (decorView.parent is ViewGroup) {
      decorView = decorView.parent as ViewGroup
    }

    // Create an intercepting view group that wraps the DecorView content
    // We'll override dispatchKeyEvent at this level
    if (decorView.childCount > 0) {
      val originalContent = decorView.getChildAt(0)

      // Only wrap if not already wrapped
      if (originalContent !is KeyEventInterceptor) {
        decorView.removeViewAt(0)

        val interceptor = KeyEventInterceptor(context)
        interceptor.addView(originalContent)
        decorView.addView(interceptor)
      }
    }
  }

  private fun removeWindowInterception() {
    // We don't need to remove the interceptor since it's harmless
    // and removing it would be complex
  }

  // KeyEventHandler implementation
  override fun handleKeyDown(keyCode: Int, event: KeyEvent) {
    onKeyPress(mapOf(
      "key" to keyCode.toString(),
      "shiftKey" to event.isShiftPressed,
      "ctrlKey" to event.isCtrlPressed,
      "altKey" to event.isAltPressed,
      "metaKey" to event.isMetaPressed,
      "repeat" to (event.repeatCount > 0)
    ))
  }

  override fun handleKeyUp(keyCode: Int, event: KeyEvent) {
    onKeyRelease(mapOf(
      "key" to keyCode.toString(),
      "shiftKey" to event.isShiftPressed,
      "ctrlKey" to event.isCtrlPressed,
      "altKey" to event.isAltPressed,
      "metaKey" to event.isMetaPressed,
      "repeat" to false
    ))
  }
}

// Custom ViewGroup that intercepts all key events at window level
class KeyEventInterceptor(context: Context) : ViewGroup(context) {

  init {
    // Make this view completely transparent and non-interactive
    setBackgroundColor(android.graphics.Color.TRANSPARENT)
    background = null
    isClickable = false
    isFocusable = false
    isFocusableInTouchMode = false
    setWillNotDraw(true)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // Layout the single child to fill this view
    if (childCount > 0) {
      val child = getChildAt(0)
      child.layout(0, 0, r - l, b - t)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    // Pass measurement directly to child - we should be invisible
    if (childCount > 0) {
      val child = getChildAt(0)
      measureChild(child, widthMeasureSpec, heightMeasureSpec)
      setMeasuredDimension(child.measuredWidth, child.measuredHeight)
    } else {
      super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    }
  }

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    // Intercept the key event and send to our handler BEFORE dispatching
    when (event.action) {
      KeyEvent.ACTION_DOWN -> {
        ExpoKeyEventView.dispatchKeyDown(event.keyCode, event)
      }
      KeyEvent.ACTION_UP -> {
        ExpoKeyEventView.dispatchKeyUp(event.keyCode, event)
      }
    }

    // Continue with normal event dispatching to focused views
    return super.dispatchKeyEvent(event)
  }
}
