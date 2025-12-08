<div align="center">
  <h2 align="center">Expo-key-event</h2>

  <p align="center">
    Interface for reading key events from external devices such as Bluetooth keyboards/gamepads.
    <br />
    <a href="https://github.com/tlow92/expo-key-event?tab=readme-ov-file#getting-started">Getting started</a>
    &middot;
    <a href="https://github.com/tlow92/expo-key-event/issues/new">Report Bug</a>
  </p>
</div>

<br />
<br />

<div align="center">
  <table>
    <tr>
      <td align="center">
        <strong>iOS</strong><br/>
        <a href="https://github.com/user-attachments/assets/9bfc25cf-6b18-46f0-947e-3d982ed46fd5">
          <img src=".github/key-event-ios.gif" alt="iOS preview" width="250" />
        </a>
      </td>
      <td align="center">
        <strong>Android</strong><br/>
        <a href="https://github.com/user-attachments/assets/b4a71bd3-6617-4ae6-98c0-60ba285c2143">
          <img src=".github/key-event-android.gif" alt="Android preview" width="250" />
        </a>
      </td>
      <td align="center">
        <strong>Web</strong><br/>
        <a href="https://github.com/user-attachments/assets/469deda3-9254-4a66-b56f-bf79c7e20997">
          <img src=".github/key-event-web.gif" alt="Web preview" width="350" />
        </a>
      </td>
    </tr>
  </table>

</div>

## Requirements

Expo SDK >= 52

## Getting started

`npm i expo-key-event`

<br />

## Usage

Automatic listening: Key events are listened to as soon as `MyComponent` is mounted.

```tsx
import { useKeyEvent } from "expo-key-event";
import { Text } from "react-native";

export function MyComponent() {
  const { keyEvent } = useKeyEvent();

  return <Text>{keyEvent?.key}</Text>;
}
```

Manual listening: Key events are listened to when `startListening` is called.

```tsx
import { useKeyEvent } from "expo-key-event";
import { Text, View } from "react-native";

export function MyComponent() {
  // deprecated way
  // const { keyEvent, startListening, stopListening } = useKeyEvent(false);
  // new way
  const { keyEvent, keyReleaseEvent, startListening, stopListening } =
    useKeyEvent({ listenOnMount: false });

  return (
    <View>
      <Text>{keyEvent?.key}</Text>
      <Button title="Start listening" onPress={() => startListening()} />
      <Button title="Stop listening" onPress={() => stopListening()} />
    </View>
  );
}
```

Handling state yourself: If you want to handle the state yourself or don't need the state at all, you can use the `useKeyEventListener` hook instead of the `useKeyEvent` hook.

```tsx
import { KeyPressEvent, useKeyEventListener } from "expo-key-event";
import { Text, View } from "react-native";

export function MyComponent() {
  const [keyEvent, setKeyEvent] = useState<KeyPressEvent>();
  // deprecated way
  // const { startListening, stopListening } = useKeyEventListener((event) => {
  //   setKeyEvent(event);
  // }, automaticControl);
  // new way
  const { startListening, stopListening } = useKeyEventListener(
    (event) => {
      setKeyEvent(event);
    },
    {
      listenOnMount: automaticControl,
    }
  );

  return (
    <View>
      <Text>{keyEvent?.key}</Text>
      <Button title="Start listening" onPress={() => startListening()} />
      <Button title="Stop listening" onPress={() => stopListening()} />
    </View>
  );
}
```

<br />

## Run example app

`cd example`

`npm run ios` / `npm run android` / `npm run web`

<br />

## Troubleshooting

### \_expo.useEvent is not a function

This is most likely due to using Expo SDK lower than 52. `useEvent` was introduced in SDK 52.

### Error: Cannot find native module 'ExpoKeyEvent'

Make sure to use a development build and not `Expo Go`.
See https://docs.expo.dev/guides/local-app-development/ for more details.

In short: Use `npx expo run:ios` instead of `npx expo start` (make sure bundleIdentifier is set in `app.json`).

### Key events are not registered in iOS simulator

Make sure that hardware keyboard is connected to the simulator.
<img src=".github/connect-hardware-keyboard.png" alt="hardware-keyboard-simulator" width="400px" />

### Key events are not registered in Android emulator

Since the Android emulator does not support USB or Bluetooth, you need to use a physical device so that key events can be registered.

Another option is to use `adb` to send key events to the emulator.

e.g. `adb shell input keyevent 10`

<br />

## How it works

This module translates the [Apple UIKit](https://developer.apple.com/documentation/uikit/uikeyboardhidusage) and [Android KeyEvent](https://developer.android.com/reference/android/view/KeyEvent) constants to a common set of key event types matching the ones from [Web](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code).

<br />

## Todo

- [ ] Implement modifier key combinations similar to [web](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event) like altKey, ctrlKey, metaKey, shiftKey
