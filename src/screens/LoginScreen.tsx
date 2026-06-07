/**
 * KenZen Sudoku — Login Screen
 * 
 * Email + password, biometric optional, torii gate motif header.
 * Haiku-style field labels. Japanese minimalist design.
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, GRID } from '../theme/tokens';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToSignUp: () => void;
  isLoading: boolean;
  error: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigateToSignUp,
  isLoading,
  error,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = useCallback(async () => {
    if (email.trim() && password) {
      await onLogin(email.trim(), password);
    }
  }, [email, password, onLogin]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.paper }]}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Torii Gate Motif */}
        <View style={styles.header}>
          <Text style={[styles.toriiGate, { color: colors.vermilion }]}>⛩</Text>
          <Text
            style={[
              styles.title,
              { color: colors.ink, fontFamily: theme.typography.gameFont },
            ]}
          >
            健全
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.sumi, fontFamily: theme.typography.uiFont },
            ]}
          >
            Return to the path
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email field — haiku-style label */}
          <View style={styles.fieldContainer}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.sumi, fontFamily: theme.typography.uiFont },
              ]}
            >
              Your address, written in light
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.ink,
                  borderColor: colors.sumi + '44',
                  backgroundColor: colors.washi,
                  fontFamily: theme.typography.uiFont,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="samurai@kenzen.app"
              placeholderTextColor={colors.sumi + '66'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={254}
              accessibilityLabel="Email address"
              editable={!isLoading}
            />
          </View>

          {/* Password field — haiku-style label */}
          <View style={styles.fieldContainer}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.sumi, fontFamily: theme.typography.uiFont },
              ]}
            >
              The key, held in silence
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.ink,
                  borderColor: colors.sumi + '44',
                  backgroundColor: colors.washi,
                  fontFamily: theme.typography.uiFont,
                },
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••••••"
              placeholderTextColor={colors.sumi + '66'}
              secureTextEntry
              maxLength={1024}
              accessibilityLabel="Password"
              editable={!isLoading}
            />
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text
                style={[
                  styles.errorText,
                  { color: colors.vermilion, fontFamily: theme.typography.uiFont },
                ]}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Login button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading || !email.trim() || !password}
            style={[
              styles.loginButton,
              {
                backgroundColor: colors.ink,
                opacity: isLoading || !email.trim() || !password ? 0.5 : 1,
              },
            ]}
            accessibilityLabel="Login"
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.paper} />
            ) : (
              <Text
                style={[
                  styles.loginButtonText,
                  { color: colors.paper, fontFamily: theme.typography.uiFont },
                ]}
              >
                Enter the Dojo
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign up link */}
          <TouchableOpacity
            onPress={onNavigateToSignUp}
            style={styles.signUpLink}
            accessibilityLabel="Create an account"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.signUpText,
                { color: colors.sumi, fontFamily: theme.typography.uiFont },
              ]}
            >
              First time? Begin your journey
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  toriiGate: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.scale['4xl'],
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.scale.base,
    fontWeight: '300',
    letterSpacing: 1,
    opacity: 0.7,
  },
  form: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  fieldContainer: {
    marginBottom: SPACING.xl,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.scale.sm,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: GRID.cellBorderRadius + 2,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.scale.md,
  },
  errorContainer: {
    marginBottom: SPACING.md,
    padding: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.scale.sm,
    textAlign: 'center',
  },
  loginButton: {
    height: 52,
    borderRadius: GRID.cellBorderRadius + 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  loginButtonText: {
    fontSize: TYPOGRAPHY.scale.md,
    fontWeight: '500',
    letterSpacing: 1,
  },
  signUpLink: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  signUpText: {
    fontSize: TYPOGRAPHY.scale.base,
    fontWeight: '300',
  },
});

export default LoginScreen;
