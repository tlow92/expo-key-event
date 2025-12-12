import { useState } from "react";
import { SafeAreaView, Text, View, TouchableOpacity } from "react-native";

import { KeyEventDisplay } from "./KeyEventDisplay";
import { KeyEventListenerExample } from "./KeyEventListenerExample";

export default function App() {
  const [activeTab, setActiveTab] = useState<"useKeyEvent" | "useListener">(
    "useKeyEvent"
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          gap: 8,
          paddingBottom: 24,
          borderBottomWidth: 1,
          borderBottomColor: "#e0e0e0",
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("useKeyEvent")}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor:
              activeTab === "useKeyEvent" ? "#2196F3" : "#f5f5f5",
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: activeTab === "useKeyEvent" ? "white" : "#666",
            }}
          >
            useKeyEvent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("useListener")}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor:
              activeTab === "useListener" ? "#2196F3" : "#f5f5f5",
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: activeTab === "useListener" ? "white" : "#666",
            }}
          >
            useKeyEventListener
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "useKeyEvent" ? (
        <KeyEventDisplay />
      ) : (
        <KeyEventListenerExample />
      )}
    </SafeAreaView>
  );
}
