import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    const base: ViewStyle = {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
    };

    switch (size) {
      case "small":
        return { ...base, paddingVertical: 8, paddingHorizontal: 12 };
      case "large":
        return { ...base, paddingVertical: 16, paddingHorizontal: 24 };
      default:
        return base;
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: "#f0f0f0",
          borderWidth: 1,
          borderColor: "#ccc",
        };
      case "danger":
        return { backgroundColor: "#ff4444" };
      default:
        return { backgroundColor: "#007AFF" };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        getButtonStyle(),
        getVariantStyle(),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#333" : "#fff"} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "secondary" ? styles.secondaryText : styles.primaryText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: "#333",
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
