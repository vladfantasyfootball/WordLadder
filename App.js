import React, {useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from './components/auth/Landing';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'react-redux';
import MainScreen from './components/Main';
import Play from './components/main/Play';
import ProfilePage from './components/main/ProfilePage';
import PaywallScreen from './components/main/PaywallScreen';
import LeaderboardDetail from './components/main/LeaderboardDetail';
import RankProgression from './components/main/RankProgression';
import { configureStore } from '@reduxjs/toolkit'
import { user } from './redux/reducers/user';
import { wordLadder } from './redux/reducers/wordLadder';
import { leaderboard } from './redux/reducers/leaderboard';
import config from './config';
import { Alert, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import MobileAds from 'react-native-google-mobile-ads';

let app, auth;
let initError = null;

try {
  // Initialize Firebase
  const firebaseConfig = {
    apiKey: config.API_KEY,
    authDomain: config.AUTH_DOMAIN,
    projectId: config.PROJECT_ID,
    storageBucket: config.STORAGE_BUCKET,
    messagingSenderId: config.MESSAGING_SENDER_ID,
    appId: config.APP_ID,
    measurementId: config.MEASUREMENT_ID
  };

  if (!config.API_KEY) {
    throw new Error('API_KEY is missing from config');
  }

  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });

  // Initialize RevenueCat with the correct platform key
  const rcApiKey = Platform.OS === 'android'
    ? config.REVENUECAT_ANDROID_API_KEY
    : config.REVENUECAT_IOS_API_KEY;
  Purchases.configure({ apiKey: rcApiKey });
} catch (error) {
  console.error('Firebase initialization error:', error);
  initError = error.message;
}

const Stack = createNativeStackNavigator();

const AppWrapper = () => {

// Automatically adds the thunk middleware and the Redux DevTools extension
  const store = configureStore({
  // Automatically calls `combineReducers`
  reducer: {
    userState: user,
    wordLadderState: wordLadder,
    leaderboardState: leaderboard,
  }
})

  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}

function App() {
  // Show error screen if Firebase failed to initialize
  if (initError) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffebee'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold', color: '#c62828', marginBottom: 10}}>
          Initialization Error
        </Text>
        <Text style={{fontSize: 14, color: '#666', textAlign: 'center'}}>
          {initError}
        </Text>
        <Text style={{fontSize: 12, color: '#999', marginTop: 20, textAlign: 'center'}}>
          Config values:{'\n'}
          API_KEY: {config.API_KEY ? 'SET' : 'MISSING'}{'\n'}
          AUTH_DOMAIN: {config.AUTH_DOMAIN || 'MISSING'}{'\n'}
          DEV MODE: {__DEV__ ? 'true' : 'false'}
        </Text>
      </View>
    );
  }

  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  async function handleAuthStateChanged(user) {
    setUser(user);
    if (user) {
      // Link RevenueCat subscriber to the Firebase UID so purchases are
      // associated with the correct user rather than an anonymous ID.
      try {
        await Purchases.logIn(user.uid);
      } catch (e) {
        console.warn('RevenueCat logIn failed:', e);
      }
    }
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    const initAds = async () => {
      // ATT must be requested before initializing ads on iOS
      if (Platform.OS === 'ios') {
        await requestTrackingPermissionsAsync();
      }
      await MobileAds().initialize();
    };
    initAds();
  }, []);

  if (initializing) {
    return null;
  }

  if(!user){
    return (
      <NavigationContainer>{/* Rest of your app code */}
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen name="Landing" component={LandingScreen} options={{headerShown: false}}/>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen name="Main" component={MainScreen} options={{headerShown: false}}/>
          <Stack.Screen name="Play" component={Play} options={({ route, navigation }) => {return { headerTitleAlign: "center", headerTitle: ({ One: 'Classic', Two: 'Shuffle', Three: 'Morph' })[route.params.level] || `Level ${route.params.level}`, headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-back" size={28} color="#000" />
              </TouchableOpacity>
            ) }}}/>
          <Stack.Screen name="ProfilePage" component={ProfilePage} options={({ route, navigation }) => {return { headerTitleAlign: "center", headerTitle: `Profile`, headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-back" size={28} color="#000" />
              </TouchableOpacity>
            ) }}}/>
          {/* <Stack.Screen name="Paywall" component={PayWall} options={{headerShown: false, presentation: 'modal'}}/> */}
          <Stack.Screen name="Paywall" component={PaywallScreen} options={{headerShown: false, presentation: 'modal'}}/>
          <Stack.Screen name="LeaderboardDetail" component={LeaderboardDetail} options={({ route, navigation }) => ({
            headerTitleAlign: 'center',
            headerTitle: ({ ['totalScore']: 'Total Score', ['averageScore']: 'Average Score', ['currentStreak']: 'Current Streak', ['longestStreak']: 'Longest Streak', ['totalSolved']: 'Puzzles Solved' })[route.params?.category] || 'Leaderboard',
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-back" size={28} color="#000" />
              </TouchableOpacity>
            ),
          })}/>
          <Stack.Screen name="RankProgression" component={RankProgression} options={({ navigation }) => ({
            headerTitleAlign: 'center',
            headerTitle: 'Rank Progression',
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-back" size={28} color="#000" />
              </TouchableOpacity>
            ),
          })}/>
        </Stack.Navigator>
      </NavigationContainer>
  )
}

export default AppWrapper