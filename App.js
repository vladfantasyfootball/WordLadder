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
import { configureStore } from '@reduxjs/toolkit'
import { user } from './redux/reducers/user';
import { wordLadder } from './redux/reducers/wordLadder';
import config from './config';
import { Alert, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    wordLadderState: wordLadder
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
  function handleAuthStateChanged(user) {
    setUser(user);
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
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
          <Stack.Screen name="Play" component={Play} options={({ route, navigation }) => {return { headerTitleAlign: "center", headerTitle: `Level ${route.params.level}`, headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 12 }}>
                <Ionicons name="chevron-back" size={28} color="#000" />
              </TouchableOpacity>
            ) }}}/>
          <Stack.Screen name="ProfilePage" component={ProfilePage} options={({ route, navigation }) => {return { headerTitleAlign: "center", headerTitle: `Profile`}}}/>
          {/* <Stack.Screen name="Paywall" component={PayWall} options={{headerShown: false, presentation: 'modal'}}/> */}
        </Stack.Navigator>
      </NavigationContainer>
  )
}

export default AppWrapper