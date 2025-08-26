import React, { useMemo, useState, useCallback } from "react";

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
  
  const handleChange = (e) => {
      if(onChangeText) onChangeText(e.target.value);
      if(onChange) onChange(e);
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

    return Object.assign({}, ...stylesArray);
  }, [focused, hasError, isDisabled, inputStyle]);

  const labelStyles = useMemo(() => {
    const stylesArray = [styles.label];
    if (isDisabled) stylesArray.push(styles.labelDisabled);
    if (hasError) stylesArray.push(styles.labelError);
    return Object.assign({}, ...stylesArray);
  }, [isDisabled, hasError]);


  return (
    <div style={{...styles.wrapper, ...containerStyle}}>
      {label ? (
        <label style={labelStyles}>
          {label}
        </label>
      ) : null}

      <div style={styles.inputContainer}>
        <input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isDisabled}
          type={secure ? "password" : "text"}
          style={inputStyles}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {secureTextEntry && showPasswordToggle ? (
          <button
            onClick={() => setSecure((s) => !s)}
            style={styles.passwordToggle}
          >
            <span style={styles.passwordToggleText}>
              {secure ? "Mostrar" : "Ocultar"}
            </span>
          </button>
        ) : null}
      </div>

      {hasError ? (
        <p style={styles.errorMsg}>{errorText}</p>
      ) : helperText ? (
        <p style={styles.helper}>{helperText}</p>
      ) : null}
    </div>
  );
}

const tokens = {
  colors: {
    brand: "#047857",
    focus: "#047857", 
    textPrimary: "#111827",
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

const styles = {
  wrapper: {
    marginBottom: tokens.space.lg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: "center",
    fontFamily: 'sans-serif',
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
    borderStyle: 'solid',
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.sm,
    width: 300,
    height: 40,
    padding: `0 ${tokens.space.sm}px`,
    fontSize: 14,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
    boxSizing: 'border-box',
  },

  inputDisabled: {
    backgroundColor: tokens.colors.disabledBg,
    color: tokens.colors.disabledText,
    borderColor: tokens.colors.border,
    cursor: 'not-allowed',
  },

  inputFocused: {
    borderColor: tokens.colors.focus,
    outline: 'none',
  },

  inputError: {
    borderColor: tokens.colors.error,
    backgroundColor: tokens.colors.errorBg,
  },

  errorMsg: {
    marginTop: tokens.space.xs,
    color: tokens.colors.error,
    fontSize: 12,
    alignSelf: "flex-start",
    margin: 0,
    marginTop: tokens.space.xs,
  },

  helper: {
    marginTop: tokens.space.xs,
    color: tokens.colors.textSecondary,
    fontSize: 12,
    alignSelf: "flex-start",
    margin: 0,
    marginTop: tokens.space.xs,
  },

  passwordToggle: {
    position: "absolute",
    right: tokens.space.sm,
    top: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: "center",
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  passwordToggleText: {
    fontSize: 12,
    color: tokens.colors.brand,
    fontWeight: "600",
  },
};