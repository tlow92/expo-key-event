package expo.modules.keyevent

import android.view.ViewGroup
import android.view.View
import android.content.Context

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import expo.modules.keyevent.ExpoKeyEventView


class ExpoKeyEventModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoKeyEvent")
    Events("onKeyPress")
    Function("startListening") {
      // currentActivity might be null if the app is backgrounded or not yet ready
      val activity = appContext.currentActivity ?: return@Function null

      activity.runOnUiThread {
        // Get the root view (which is typically a ViewGroup)
        val rootView = activity.findViewById<ViewGroup>(android.R.id.content)

        // Create and add our listener view
        val listenerView = ExpoKeyEventView(activity, appContext) { eventData: Map<String, String> ->
          // Send the event back to JS
          sendEvent("onKeyPress", eventData)
        }

        rootView.addView(listenerView)

        // Make sure our view actually gets focus
        listenerView.requestFocus()
      }

      return@Function null
    }

    Function("stopListening") {
      // currentActivity might be null if the app is backgrounded or not yet ready
      val activity = appContext.currentActivity ?: return@Function null

      activity.runOnUiThread {
        listenerView.removeFromParent()
      }
    }
  }
}