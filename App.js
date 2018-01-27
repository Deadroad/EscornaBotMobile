import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity
} from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { Router, Scene } from 'react-native-router-flux';
// import { StackNavigator, TabNavigator } from 'react-navigation';

import PadScreen from './screens/PadScreen';
import DevicesScreen from './screens/DevicesScreen';

/**
 * Screen with tabs shown on app startup.
 */
// const HomeScreenTabNavigatorObj = TabNavigator({
//         Pad: {
//             screen: PadScreen,
//         },
//         Devices: {
//             screen: DevicesScreen,
//         },
//     }, {
//         tabBarOptions: {
//             showLabel: false
//         }
//     }
// );

const TabIcon = ({ selected, title }) => {
    let icon = null;
    switch (title) {
        case 'Pad':
            icon = <Icon name="all-out" size={28} />;
            break;
        case 'Devices':
            icon = <Icon name="settings-bluetooth" size={28} />;
            break;
    }
    return (icon);
}

const HomeScreenTabNavigator = () => {
    return (
        <Router>
            <Scene key="root">
                <Scene
                    key="tabbar"
                    tabs
                    tabBarStyle={{ backgroundColor: '#FFFFFF' }}
                    activeBackgroundColor="#fffc9e"
                    inactiveBackgroundColor="transparent"
                    activeTintColor="#fff"
                    inactiveTintColor="#333"
                    tabBarPosition="bottom"
                    showIcon={true}
                    showLabel={false}
                    lazy={true}
                    >
                    <Scene
                      key="pad"
                      component={PadScreen}
                      title="Pad"
                      icon={TabIcon}
                      initial
                    />
                    <Scene
                      key="devices"
                      component={DevicesScreen}
                      title="Devices"
                      icon={TabIcon}
                    />
                </Scene>
            </Scene>
        </Router>
    );
}

export default HomeScreenTabNavigator;