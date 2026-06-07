/**
 * KenZen Sudoku — Navigation Configuration
 * 
 * React Navigation 6 native stack with custom transition animations.
 * All screen transitions use custom animations — NOT the default slide.
 */

import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Difficulty, GameMode, OpponentType } from '../types';

// ─── Route Types ──────────────────────────────────────────────

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  GameSetup: undefined;
  Game: {
    gameId: string;
  };
  GameResult: {
    gameId: string;
    won: boolean;
    score: number;
  };
  MultiplayerLobby: undefined;
  LifetimeStats: undefined;
  Profile: undefined;
  Replay: {
    gameId: string;
  };
};

export type ScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Screen Names ─────────────────────────────────────────────

export const SCREENS = {
  SPLASH: 'Splash' as const,
  ONBOARDING: 'Onboarding' as const,
  LOGIN: 'Login' as const,
  SIGN_UP: 'SignUp' as const,
  HOME: 'Home' as const,
  GAME_SETUP: 'GameSetup' as const,
  GAME: 'Game' as const,
  GAME_RESULT: 'GameResult' as const,
  MULTIPLAYER_LOBBY: 'MultiplayerLobby' as const,
  LIFETIME_STATS: 'LifetimeStats' as const,
  PROFILE: 'Profile' as const,
  REPLAY: 'Replay' as const,
};
