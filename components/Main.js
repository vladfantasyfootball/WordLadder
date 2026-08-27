import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchUser, getWordLadders, fetchLeaderboardGroups, updateUser } from '../redux/actions';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './main/Home';
import Stats from './main/Stats';
import Leaderboards from './main/Leaderboards';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import Profile from './main/Profile';
import { getAuth } from 'firebase/auth';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import * as Notifications from 'expo-notifications';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';


const Tab = createBottomTabNavigator();

export class MainScreen extends Component {
    constructor(props) {
        super(props);
        this.state = { loadError: false };
        this._loadTimeout = null;
    }

    componentDidMount() {
        const auth = getAuth();
        this._loadTimeout = setTimeout(() => {
            // If data still hasn't arrived after 30s assume cold-start timeout
            if (!this.props.currentUser || !this.props.wordLadder?.one?.startingWord) {
                this.setState({ loadError: true });
            }
        }, 30000);
        this.props.fetchUser(auth);
        this.props.getWordLadder(auth);
        this.props.fetchLeaderboardGroups(auth);
        Notifications.getPermissionsAsync().then(({ status }) => {
            if (status === 'granted') {
                Notifications.setBadgeCountAsync(0).catch(() => {});
            }
        }).catch(() => {});
    }

    componentDidUpdate(prevProps) {
        const loaded = this.props.currentUser && this.props.wordLadder?.one?.startingWord;
        if (loaded && this._loadTimeout) {
            clearTimeout(this._loadTimeout);
            this._loadTimeout = null;
        }
        // Refresh push token once when user first loads
        if (!prevProps.currentUser && this.props.currentUser) {
            this._refreshPushToken();
        }
    }

    _refreshPushToken = async () => {
        const { currentUser } = this.props;
        if (!currentUser?.notifications?.enabled) return;
        try {
            const auth = getAuth();
            const newToken = await registerForPushNotificationsAsync();
            if (newToken && newToken !== currentUser.notifications.expoPushToken) {
                this.props.updateUser(currentUser._id, {
                    notifications: { ...currentUser.notifications, expoPushToken: newToken }
                }, auth);
            }
        } catch (e) {
            console.error('Error refreshing push token:', e);
        }
    }

    componentWillUnmount() {
        if (this._loadTimeout) clearTimeout(this._loadTimeout);
    }

    retry = () => {
        const auth = getAuth();
        this.setState({ loadError: false });
        this._loadTimeout = setTimeout(() => {
            if (!this.props.currentUser || !this.props.wordLadder?.one?.startingWord) {
                this.setState({ loadError: true });
            }
        }, 30000);
        this.props.fetchUser(auth);
        this.props.getWordLadder(auth);
    }

    render() {
        const { currentUser, wordLadder } = this.props;
        const { loadError } = this.state;
        const isLoaded = currentUser && wordLadder?.one?.startingWord;

        if (loadError) {
            return (
                <ImageBackground
                    source={require('../assets/splash.png')}
                    style={styles.bgFull}
                    resizeMode="cover"
                >
                    <View style={styles.bottomArea}>
                        <Text style={styles.errorTitle}>{'Connection issue'}</Text>
                        <Text style={styles.errorBody}>{'The server took too long to respond.\nThis usually resolves in a few seconds.'}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={this.retry}>
                            <Text style={styles.retryText}>{'Try again'}</Text>
                        </TouchableOpacity>
                    </View>
                </ImageBackground>
            );
        }

        if (!isLoaded) {
            return (
                <ImageBackground
                    source={require('../assets/splash.png')}
                    style={styles.bgFull}
                    resizeMode="cover"
                >
                    <View style={styles.bottomArea}>
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                </ImageBackground>
            );
        }

        return (
            <Tab.Navigator initialRouteName='Word Ladder'>
                <Tab.Screen
                    name={"Word Ladder"}
                    component={Home}
                    options={{
                        headerTitleAlign: 'center',
                        headerRight: () => (
                            <Profile {...this.props}/>
                        ),
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="home" color={color} size={size} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Leaderboard"
                    component={Stats}
                    options={{
                        headerTitleAlign: 'center',
                        headerRight: () => (
                            <Profile {...this.props}/>
                        ),
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="leaderboard" color={color} size={size} />
                        ),
                    }}
                />
                {/* <Tab.Screen
                    name="Leaderboards"
                    component={Leaderboards}
                    options={{
                        headerTitleAlign: 'center',
                        headerRight: () => (
                            <Profile {...this.props}/>
                        ),
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="leaderboard" color={color} size={size} />
                        ),
                    }}
                /> */}
            </Tab.Navigator>
        )
    }
}

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
    wordLadder: store.wordLadderState.wordLadder,
})
const mapDispatchProps = (dispatch) => bindActionCreators({ fetchUser, getWordLadder: getWordLadders, fetchLeaderboardGroups, updateUser }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(MainScreen);

const styles = StyleSheet.create({
    bgFull: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    bottomArea: {
        position: 'absolute',
        bottom: 160,
        left: 0,
        right: 0,
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
    },
    loadingText: {
        fontSize: 15,
        color: '#888',
        marginTop: 8,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1C1C1E',
        textAlign: 'center',
    },
    errorBody: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
    },
    retryBtn: {
        marginTop: 8,
        backgroundColor: '#9ADBFA',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    retryText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C1C1E',
    },
});