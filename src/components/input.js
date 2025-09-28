import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";

export default function Input({
  label,
  value,
  onChangeText, 
  onChange, 
  placeholder,
  errorText,
  helperText,
  disabled,
  editable,
  secureTextEntry,
  showPasswordToggle,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(!!secureTextEntry);

  const isDisabled = disabled || editable === false;
  const hasError = !!errorText;

  const handleFocus = useCallback(
    (e) => {
      setFocused(true);
      if (onFocus) onFocus(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e) => {
      setFocused(false);
      if (onBlur) onBlur(e);
    },
    [onBlur]
  );
  
  const handleChange = (text) => {
      if(onChangeText) onChangeText(text);
      if(onChange) onChange(text);
  }

  const inputStyles = useMemo(() => {
    const stylesArray = [styles.input];
    if (isDisabled) {
      stylesArray.push(styles.inputDisabled);
    }
    if (hasError) {
      stylesArray.push(styles.inputError);
    } else if (focused) {
      stylesArray.push(styles.inputFocused);
    }
    if (inputStyle) {
        stylesArray.push(inputStyle);
    }

    return stylesArray;
  }, [focused, hasError, isDisabled, inputStyle]);

  const labelStyles = useMemo(() => {
    const stylesArray = [styles.label];
    if (isDisabled) stylesArray.push(styles.labelDisabled);
    if (hasError) stylesArray.push(styles.labelError);
    return stylesArray;
  }, [isDisabled, hasError]);


  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={labelStyles}>
          {label}
        </Text>
      ) : null}

      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          editable={!isDisabled}
          secureTextEntry={secure}
          style={inputStyles}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {secureTextEntry && showPasswordToggle ? (
          <Pressable
            onPress={() => setSecure((s) => !s)}
            style={styles.passwordToggle}
          >
            <Text style={styles.passwordToggleText}>
              {secure ? "Mostrar" : "Ocultar"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <Text style={styles.errorMsg}>{errorText}</Text>
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const tokens = {
  colors: {
    brand: "#047857",
    focus: "#047857", 
    textPrimary: "#121212",
    textSecondary: "#6B7280",
    textInverse: "#FFFFFF",
    surface: "#FFFFFF",
    bg: "#F8F7F7",
    border: "#3A3A3A",
    disabledBg: "#F8F7F7",
    disabledText: "#B1B1B1",
    error: "#EF4444",
    errorBg: "#F8F7F7",
  },
  radius: { sm: 4, md: 4, lg: 4 },
  space: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24 },
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
    flexDirection: 'column',
    alignItems: "stretch",
    width: '100%',
  },

  label: {
    color: tokens.colors.textPrimary,
    fontSize: 14,
    marginBottom: tokens.space.xs,
    alignSelf: "flex-start",
  },
  labelDisabled: {
    color: tokens.colors.disabledText,
  },
  labelError: {
    color: tokens.colors.error,
  },

  inputContainer: {
    position: "relative",
  },

  input: {
    borderWidth: 1.2,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.sm,
    width: '100%',
    height: 40,
    paddingHorizontal: tokens.space.sm,
    fontSize: 14,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
  },

  inputDisabled: {
    backgroundColor: tokens.colors.disabledBg,
    color: tokens.colors.disabledText,
    borderColor: tokens.colors.border,
  },

  inputFocused: {
    borderColor: tokens.colors.focus,
  },

  inputError: {
    borderColor: tokens.colors.error,
    backgroundColor: tokens.colors.errorBg,
  },

  errorMsg: {
    position: "absolute",
    top: "100%",       
    left: 4,
    fontSize: 12,
    color: tokens.colors.error,
  },

  helper: {
    marginTop: tokens.space.xs,
    color: tokens.colors.textSecondary,
    fontSize: 12,
    alignSelf: "flex-start",
  },

  passwordToggle: {
    position: "absolute",
    right: tokens.space.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 0,
  },
  passwordToggleText: {
    fontSize: 12,
    color: tokens.colors.brand,
    fontWeight: "600",
  },
});