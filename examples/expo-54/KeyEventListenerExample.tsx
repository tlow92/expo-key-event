import { useKeyEventListener } from "expo-key-event";
import { useState } from "react";
import { Text, View, Switch } from "react-native";
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
    <View style={{ flex: 1, width: "100%", gap: 32, marginTop: 32 }}>
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
          <Text style={{ fontSize: 18, fontWeight: "500" }}>
            Capture modifier keys
          </Text>
          <Text style={{ fontSize: 14, color: "#666" }}>
            Shows shift, ctrl, alt, meta, and repeat
          </Text>
        </View>
      </View>

      <Animated.FlatList
        contentContainerStyle={{
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
        data={keyLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
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
              style={{
                flexDirection: "row",
                alignItems: "center",
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
                <Text
                  style={{ fontSize: 12, color: "white", fontWeight: "600" }}
                >
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
                <Text style={{ fontSize: 20, color: "#666" }}>
                  {modifiers.join(" ")}
                </Text>
              )}
            </Animated.View>
          );
        }}
      />
    </View>
  );
}
