import React, { Component } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Game from './Game';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

const Tab = createMaterialTopTabNavigator();

export class Home extends Component {
  componentDidMount() { }
  render() {
    return (
      <Tab.Navigator initialRouteName='Level One'>
        <Tab.Screen
          name={"Level One"}
          options={{
            headerTitleAlign: 'center',
          }}>
          {props => <Game {...props} level={'One'} route={props.route} />}
        </Tab.Screen>
        <Tab.Screen
          name={"Level Two"}
          options={{
            headerTitleAlign: 'center',
          }}>
          {props => <Game {...props} level={'Two'} route={props.route} />}
        </Tab.Screen>
        <Tab.Screen
          name={"Level Three"}
          options={{
            headerTitleAlign: 'center',
          }}>
          {props => <Game {...props} level={'Three'} route={props.route} />}
        </Tab.Screen>}
      </Tab.Navigator>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    height: 50,
  },
  buttonContainer: {
    flex: 1,
  },
  levelButton: {
    backgroundColor: 'gray',
  }
});

const mapStateToProps = (store) => ({})
const mapDispatchProps = (dispatch) => bindActionCreators({}, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Home);
