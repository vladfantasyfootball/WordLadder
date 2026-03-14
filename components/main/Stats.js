import React, { Component } from 'react';
import { StyleSheet } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import LevelStat from './LevelStat';

const Tab = createMaterialTopTabNavigator();

export class Stats extends Component {
  componentDidMount() { }
  render() {
    return (
      <Tab.Navigator initialRouteName='Level One'>
        <Tab.Screen
          name={"Level One"}
          options={{
            headerTitleAlign: 'center',
          }}>
          {props => <LevelStat {...props} level={'One'} />}
        </Tab.Screen>
        <Tab.Screen
          name={"Level Two"}
          options={{
            headerTitleAlign: 'center',
          }}>
          {props => <LevelStat {...props} level={'Two'} />}
        </Tab.Screen>
        <Tab.Screen
          name={"Level Three"}
          options={{
            headerTitleAlign: 'center',
          }}>
          {props => <LevelStat {...props} level={'Three'} />}
        </Tab.Screen>
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

export default connect(mapStateToProps, mapDispatchProps)(Stats);