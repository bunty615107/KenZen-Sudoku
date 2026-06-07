/**
 * KenZen Sudoku — App Entry Point
 * 
 * Configures ThemeProvider, SafeAreaProvider, and React Navigation.
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import type { RootStackParamList } from './src/navigation/types';
import { SCREENS } from './src/navigation/types';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import GameResultScreen from './src/screens/GameResultScreen';
import MultiplayerLobbyScreen from './src/screens/MultiplayerLobbyScreen';
import LifetimeStatsScreen from './src/screens/LifetimeStatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { getAuthService } from './src/bootstrap';
import { useStore } from './src/store/useStore';

// ─── Login Container ─────────────────────────────────────────

const LoginContainer = (props: any) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authService = getAuthService();
      const result = await authService.login(email, pass);
      if (result.success && result.user && result.token) {
        useStore.getState().setAuth(result.user, result.token);
        props.navigation.replace(SCREENS.HOME);
      } else {
        setError(result.error?.message || 'Login failed');
      }
    } catch (e) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginScreen
      {...props}
      onLogin={handleLogin}
      onNavigateToSignUp={() => {
        // TODO: Navigate to SignUp
      }}
      isLoading={isLoading}
      error={error}
    />
  );
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Root Navigator ──────────────────────────────────────────

const RootNavigator = () => {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.paper}
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={SCREENS.SPLASH}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.paper },
            animation: 'fade', // Custom fade transition instead of slide
          }}
        >
          <Stack.Screen name={SCREENS.SPLASH}>
            {(props) => (
              <SplashScreen
                {...props}
                onFinish={(isAuthenticated) => {
                  props.navigation.replace(isAuthenticated ? SCREENS.HOME : SCREENS.LOGIN);
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name={SCREENS.LOGIN} component={LoginContainer} />

          <Stack.Screen name={SCREENS.HOME}>
            {(props) => (
              <HomeScreen
                {...props}
                userName="Wandering Samurai"
                stats={null}
                onPlaySolo={() => {
                  props.navigation.navigate(SCREENS.GAME, { gameId: 'mock-game-123' });
                }}
                onPlayVsAI={() => console.log('VS AI')}
                onMultiplayer={() => props.navigation.navigate(SCREENS.MULTIPLAYER_LOBBY)}
                onViewStats={() => props.navigation.navigate(SCREENS.LIFETIME_STATS)}
                onProfile={() => props.navigation.navigate(SCREENS.PROFILE)}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name={SCREENS.GAME} component={GameScreen} />
          <Stack.Screen name={SCREENS.GAME_RESULT} component={GameResultScreen} />
          <Stack.Screen name={SCREENS.MULTIPLAYER_LOBBY} component={MultiplayerLobbyScreen} />
          <Stack.Screen name={SCREENS.LIFETIME_STATS} component={LifetimeStatsScreen} />
          <Stack.Screen name={SCREENS.PROFILE} component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

// ─── App Root ───────────────────────────────────────────────

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
