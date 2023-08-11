import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchUser, getWordLadders } from '../redux/actions';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './main/Home';
import Stats from './main/Stats';
import Leaderboards from './main/Leaderboards';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import Profile from './main/Profile';

const Tab = createBottomTabNavigator();

export class MainScreen extends Component {
    componentDidMount() {
        this.props.fetchUser();
        this.props.getWordLadder();
    }

    render() {
        return (
            <Tab.Navigator initialRouteName='Home'>
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
                    name="Stats"
                    component={Stats}
                    options={{
                        headerTitleAlign: 'center',
                        headerRight: () => (
                            <Profile {...this.props}/>
                        ),
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="stats-chart" color={color} size={size} />
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
const mapDispatchProps = (dispatch) => bindActionCreators({ fetchUser, getWordLadder: getWordLadders }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(MainScreen);