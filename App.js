import React, {useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from './components/auth/Landing';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Provider } from 'react-redux';
import MainScreen from './components/Main';
import Play from './components/main/Play';
import ProfilePage from './components/main/ProfilePage';
import { configureStore } from '@reduxjs/toolkit'
import { user } from './redux/reducers/user';
import { wordLadder } from './redux/reducers/wordLadder';
import config from './config';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function handleAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

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
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen name="Main" component={MainScreen} options={{headerShown: false}}/>
          <Stack.Screen name="Play" component={Play} options={({ route, navigation }) => {return { headerTitleAlign: "center", headerTitle: `Level ${route.params.level}`}}}/>
          <Stack.Screen name="ProfilePage" component={ProfilePage} options={({ route, navigation }) => {return { headerTitleAlign: "center", headerTitle: `Profile`}}}/>
          {/* <Stack.Screen name="Paywall" component={PayWall} options={{headerShown: false, presentation: 'modal'}}/> */}
        </Stack.Navigator>
      </NavigationContainer>
  )
}

export default AppWrapper