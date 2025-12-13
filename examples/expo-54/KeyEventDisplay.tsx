import { useKeyEvent } from "expo-key-event";
import { useEffect, useState } from "react";
import { Button, Switch, Text, View } from "react-native";
import Animated, { FadeInLeft } from "react-native-reanimated";

type DisplayedKey = {
  id: string;
  keyCode: string;
  eventType: "press" | "release";
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  repeat?: boolean;
};

export function KeyEventDisplay() {
  const [automaticControl, setAutomaticControl] = useState(true);
  const [listening, setListening] = useState(false);
  const [listenToRelease, setListenToRelease] = useState(true);
  const [captureModifiers, setCaptureModifiers] = useState(false);
  const { keyEvent, keyReleaseEvent, startListening, stopListening } =
    useKeyEvent({
      listenOnMount: automaticControl,
      listenToRelease,
      captureModifiers,
    });

  const [keys, setKeys] = useState<DisplayedKey[]>([]);

  useEffect(() => {
    if (!keyEvent?.key) return;
    setKeys((_) => {
      if (_.length > 10) _.pop();
      return [
        {
          id: Math.random().toString(),
          keyCode: keyEvent.key,
          eventType: "press",
          shiftKey: keyEvent.shiftKey,
          ctrlKey: keyEvent.ctrlKey,
          altKey: keyEvent.altKey,
          metaKey: keyEvent.metaKey,
          repeat: keyEvent.repeat,
        },
        ..._,
      ];
    });
  }, [keyEvent, setKeys]);

  useEffect(() => {
    if (!listenToRelease || !keyReleaseEvent?.key) return;
    setKeys((_) => {
      if (_.length > 10) _.pop();
      return [
        {
          id: Math.random().toString(),
          keyCode: keyReleaseEvent.key,
          eventType: "release",
          shiftKey: keyReleaseEvent.shiftKey,
          ctrlKey: keyReleaseEvent.ctrlKey,
          altKey: keyReleaseEvent.altKey,
          metaKey: keyReleaseEvent.metaKey,
          repeat: keyReleaseEvent.repeat,
        },
        ..._,
      ];
    });
  }, [keyReleaseEvent, setKeys, listenToRelease]);

  useEffect(() => {
    if (automaticControl) return;
    if (listening) startListening();
    else stopListening();
  }, [listening, automaticControl]);

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        maxWidth: 600,
        gap: 32,
        marginTop: 32,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 24,
          paddingHorizontal: 16,
        }}
      >
        <Switch
          onValueChange={() => {
            setAutomaticControl((_) => !_);
          }}
          value={automaticControl}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "500" }}>
            Control listener automatically
          </Text>
          <Text style={{ fontSize: 14, color: "#666" }}>
            Listener is added/removed when component mounts/unmounts
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 24,
          paddingHorizontal: 16,
        }}
      >
        <Switch
          onValueChange={() => {
            setListenToRelease((_) => !_);
          }}
          value={listenToRelease}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "500" }}>
            Listen to key release events
          </Text>
          <Text style={{ fontSize: 14, color: "#666" }}>
            Shows both press and release events
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 24,
          paddingHorizontal: 16,
        }}
      >
        <Switch
          onValueChange={() => {
            setCaptureModifiers((_) => !_);
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
      {automaticControl === false && (
        <View style={{ alignSelf: "center" }}>
          <Button
            title={listening ? "Stop listening" : "Start listening"}
            onPress={() => setListening((_) => !_)}
          />
        </View>
      )}
      <Animated.FlatList
        contentContainerStyle={{
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
        data={keys}
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
                {item.keyCode}
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
