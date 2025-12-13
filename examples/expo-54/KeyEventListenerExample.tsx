import { useKeyEventListener } from "expo-key-event";
import React, { useState } from "react";
import { Text, View, Switch, TextInput, ScrollView } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeInLeft } from "react-native-reanimated";

type KeyLog = {
  id: string;
  key: string;
  eventType: "press" | "release";
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  repeat?: boolean;
};

export function KeyEventListenerExample() {
  const [listenToRelease, setListenToRelease] = useState(true);
  const [captureModifiers, setCaptureModifiers] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [keyLogs, setKeyLogs] = useState<KeyLog[]>([]);

  useKeyEventListener(
    (event) => {
      const newLog: KeyLog = {
        id: Math.random().toString(),
        key: event.key,
        eventType: event.eventType,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        repeat: event.repeat,
      };

      setKeyLogs((prev) => {
        const updated = [newLog, ...prev];
        return updated.slice(0, 10); // Keep last 10 events
      });
    },
    {
      listenOnMount: true,
      preventReload: false,
      listenToRelease,
      captureModifiers,
    }
  );

  return (
    <KeyboardAwareScrollView style={{ flex: 1, width: "100%", gap: 32, marginTop: 32 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 16,
          backgroundColor: "#fff",
        }}
        placeholder="Type here to show virtual keyboard..."
        value={textInputValue}
        onChangeText={setTextInputValue}
        multiline
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 24,
          paddingHorizontal: 16,
          alignSelf: "center",
        }}
      >
        <Switch
          onValueChange={() => {
            setListenToRelease((_) => !_);
            // Clear logs when toggling to see the difference
            setKeyLogs([]);
          }}
          value={listenToRelease}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "500" }}>
            Listen to key release events
          </Text>
          <Text style={{ fontSize: 14, color: "#666" }}>
            Callback receives both press and release
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 24,
          paddingHorizontal: 16,
          alignSelf: "center",
        }}
      >
        <Switch
          onValueChange={() => {
            setCaptureModifiers((_) => !_);
            // Clear logs when toggling to see the difference
            setKeyLogs([]);
          }}
          value={captureModifiers}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "500" }}>Capture modifier keys</Text>
          <Text style={{ fontSize: 14, color: "#666" }}>
            Shows shift, ctrl, alt, meta, and repeat
          </Text>
        </View>
      </View>

      {keyLogs.map((item, index) => {
        const isPress = item.eventType === "press";
        const isPressColor = "#4CAF50";
        const isReleaseColor = "#FF5722";

        const modifiers = [];
        if (item.shiftKey) modifiers.push("⇧");
        if (item.ctrlKey) modifiers.push("⌃");
        if (item.altKey) modifiers.push("⌥");
        if (item.metaKey) modifiers.push("⌘");
        if (item.repeat) modifiers.push("🔁");

        return (
          <Animated.View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "center",
              gap: 12,
              paddingVertical: 4,
            }}
            entering={FadeInLeft}
          >
            <View
              style={{
                width: 80,
                paddingVertical: 4,
                paddingHorizontal: 8,
                backgroundColor: isPress ? isPressColor : isReleaseColor,
                borderRadius: 4,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 12, color: "white", fontWeight: "600" }}>
                {isPress ? "PRESS" : "RELEASE"}
              </Text>
            </View>
            <Text
              style={[
                index === 0 ? { fontWeight: "bold" } : {},
                { fontSize: 24, minWidth: 100 },
              ]}
            >
              {item.key}
            </Text>
            {modifiers.length > 0 && (
              <Text style={{ fontSize: 20, color: "#666" }}>{modifiers.join(" ")}</Text>
            )}
          </Animated.View>
        );
      })}
    </KeyboardAwareScrollView>
  );
}
