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
import YesterdaySolution from './components/main/YesterdaySolution';
import { configureStore } from '@reduxjs/toolkit'
import { user } from './redux/reducers/user';
import { wordLadder } from './redux/reducers/wordLadder';
import { leaderboard } from './redux/reducers/leaderboard';
import { leaderboardGroups } from './redux/reducers/leaderboardGroups';
import config from './config';
import { Alert, View, Text, TouchableOpacity, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { adsInitialized } from './utils/ads';
import { joinLeaderboardGroup } from './redux/actions';

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
  Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: rcApiKey });
} catch (error) {
  console.error('Firebase initialization error:', error);
  initError = error.message;
}

const Stack = createNativeStackNavigator();

// Store is created once outside the component — inside the function body it
// would be recreated on every render, wiping all Redux state during HMR.
const store = configureStore({
  reducer: {
    userState: user,
    wordLadderState: wordLadder,
    leaderboardState: leaderboard,
    leaderboardGroupsState: leaderboardGroups,
  }
});

const AppWrapper = () => {
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
    // Request ATT on iOS - adsInitialized is already running in parallel
    if (Platform.OS === 'ios') {
      requestTrackingPermissionsAsync();
    }
  }, []);

  // Handle Universal Links for group invites — both cold-start and while running
  useEffect(() => {
    if (!user) return; // only handle once authenticated

    const handleJoinUrl = async (url) => {
      if (!url) return;
      const match = url.match(/\/join\/([a-f0-9]{24})/i);
      if (!match) return;
      const groupId = match[1];
      try {
        await store.dispatch(joinLeaderboardGroup(groupId, auth));
        Alert.alert('Joined! 🎉', 'You have been added to the leaderboard group.');
      } catch (e) {
        Alert.alert('Error', 'Could not join the group. The link may be invalid or expired.');
      }
    };

    // Cold-start: app opened via a join link
    Linking.getInitialURL().then(handleJoinUrl);

    // Foreground: link tapped while app is already open
    const sub = Linking.addEventListener('url', ({ url }) => handleJoinUrl(url));
    return () => sub.remove();
  }, [user]);

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
          <Stack.Screen name="YesterdaySolution" component={YesterdaySolution} options={({ route, navigation }) => ({
            headerTitleAlign: 'center',
            headerTitle: `Yesterday's ${{ One: 'Classic', Two: 'Shuffle', Three: 'Morph' }[route.params?.level] || ''} Solution`,
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