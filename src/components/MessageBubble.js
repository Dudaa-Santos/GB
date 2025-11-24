// src/components/MessageBubble.jsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

export default function MessageBubble({ text, fromUser, time, typing }) {
  // caso seja a bolha "digitando..."
  if (typing) {
    return (
      <View style={[styles.wrapper, styles.wrapperBot]}>
        <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
          <TypingDots />
        </View>
      </View>
    );
  }

  // ✅ Função para processar texto com **negrito**
  const renderTextWithBold = (text) => {
    if (!text) return null;

    // Divide o texto por ** (negrito)
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      // Se começar e terminar com **, remove os ** e aplica negrito
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2); // Remove os ** do início e fim
        return (
          <Text key={index} style={styles.boldText}>
            {boldText}
          </Text>
        );
      }
      // Caso contrário, renderiza texto normal
      return <Text key={index}>{part}</Text>;
    });
  };

  // mensagem normal
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
        <Text
          style={[styles.text, fromUser ? styles.textUser : styles.textBot]}
        >
          {renderTextWithBold(text)}
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

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnimation = (value, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 200);
    const anim3 = createAnimation(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
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

  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 70,
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

  // ✅ Estilo para texto em negrito
  boldText: {
    fontWeight: "bold",
  },

  time: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  timeUser: { color: "rgba(255,255,255,0.7)" },
  timeBot: { color: "#6B7280" },

  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6B7280",
  },
});
