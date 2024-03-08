import React, {useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from './components/auth/Landing';
import RegisterScreen from './components/auth/Register'
import LoginScreen from './components/auth/Login'
import { initializeApp, getApps} from 'firebase/app';
import { getAuth } from 'firebase/auth';
import  config from './config';
import { View, Text } from'react-native';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import rootReducer from './redux/reducers';
import thunk from 'redux-thunk';
import MainScreen from './components/Main';
import Play from './components/main/Play';
import ProfilePage from './components/main/ProfilePage';


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: config.API_KEY,
  authDomain: config.AUTH_DOMAIN,
  projectId: config.PROJECT_ID,
  storageBucket: config.STORAGE_BUCKET,
  messagingSenderId: config.MESSAGING_SENDER_ID,
  appId: config.APP_ID,
  measurementId: config.MEASUREMENT_ID
};

if(getApps.length === 0){
  const app = initializeApp(firebaseConfig);
}

const Stack = createNativeStackNavigator();

const AppWrapper = () => {
  const store = createStore(rootReducer, applyMiddleware(thunk));

  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}

function App() {
  const [loaded, setLoaded] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)


  useEffect(() => {
    const auth = getAuth();
    auth.onAuthStateChanged(async (user) => {
      if(!user){
        setLoaded(true)
        setLoggedIn(false)
      } else {
        try {
          setLoaded(true)
          setLoggedIn(true)
        } catch (error) {
          console.log(error);
        }
      }
    })
  }, [])

  if(!loaded){
    return (
      <View style={{flex: 1, justifyContent: 'center'}}>
        <Text> Loading </Text>
      </View>
    )
  }

  if(!loggedIn){
    return (
      <NavigationContainer>{/* Rest of your app code */}
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen name="Landing" component={LandingScreen} options={{headerShown: false}}/>
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
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