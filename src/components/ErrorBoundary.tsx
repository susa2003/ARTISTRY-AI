import React, { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors } from "../theme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Studio Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    try {
      router.replace("/");
    } catch {
      // Fallback
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>✎</Text>
            </View>
            <Text style={styles.title}>Studio Encountered an Issue</Text>
            <Text style={styles.subtitle}>
              Your artwork and local progress are securely saved on this device. You can reload this view or return to the main studio dashboard.
            </Text>

            {this.state.error?.message ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} numberOfLines={3}>
                  {this.state.error.message}
                </Text>
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <Pressable onPress={this.handleReset} style={styles.retryBtn}>
                <Text style={styles.retryText}>Reload View</Text>
              </Pressable>
              <Pressable onPress={this.handleGoHome} style={styles.homeBtn}>
                <Text style={styles.homeText}>Return to Home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    maxWidth: 420,
    width: "100%",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F4E7DF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
    color: colors.clay,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Georgia",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 10,
    width: "100%",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 11,
    color: "#666",
    fontFamily: "monospace",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  retryBtn: {
    flex: 1,
    backgroundColor: colors.forest,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  homeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  homeText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
});
