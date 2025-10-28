// src/components/MessageBubble.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MessageBubble({ text, fromUser, time }) {
  return (
    <View
      style={[
        styles.wrapper,
        fromUser ? styles.wrapperUser : styles.wrapperBot,
      ]}
    >
      <View
        style={[
          styles.bubble,
          fromUser ? styles.bubbleUser : styles.bubbleBot,
        ]}
      >
        <Text style={[styles.text, fromUser ? styles.textUser : styles.textBot]}>
          {text}
        </Text>

        <Text
          style={[
            styles.time,
            fromUser ? styles.timeUser : styles.timeBot,
          ]}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 12,
    flexDirection: "row",
  },
  wrapperUser: {
    justifyContent: "flex-end",
  },
  wrapperBot: {
    justifyContent: "flex-start",
  },

  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  bubbleUser: {
    backgroundColor: "#065F46",
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },

  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textUser: {
    color: "#fff",
  },
  textBot: {
    color: "#1F2937",
  },

  time: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  timeUser: { color: "rgba(255,255,255,0.7)" },
  timeBot: { color: "#6B7280" },
});
