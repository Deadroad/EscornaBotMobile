import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    NativeAppEventEmitter,
    NativeEventEmitter,
    NativeModules,
    Platform,
    PermissionsAndroid,
    ActivityIndicator,
    AppState,
    AppRegistry,
    AsyncStorage
} from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { Actions, Router, Scene } from 'react-native-router-flux';

/* Additional libs */
import BleManager from 'react-native-ble-manager';

/* Screens */
import PadScreen from './screens/PadScreen';
import DevicesScreen from './screens/DevicesScreen';

const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

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

// Actions
import * as AppActions from './actions/actions';

const mapStateToProps = state => ({
  connectedDevice: state.connectedDevice || null,
  peripherals: state.peripherals || new Map(),
  loading: state.loading || false,
});

const mapDispatchToProps = {
  setDevice: AppActions.setDevice,
  setPeripherals: AppActions.setPeripherals,
  setLoading: AppActions.setLoading,
};

class AppRoot extends Component {

    constructor(props) {
      super(props);
      this.props = props;
      this.BleManager = BleManager;
      this.bleManagerEmitter = bleManagerEmitter;
      this.state = {
        connectedDevice: null,
        service: null,
        characteristic: null,
        peripherals: new Map(),
        state: false,
        scanning: false,
        appState: '',
        loading: false
      }

      this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
      this.handleStopScan = this.handleStopScan.bind(this);
      this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
      this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
      this.handlerConnectPeripheral = this.handlerConnectPeripheral.bind(this);
      this.handleAppStateChange = this.handleAppStateChange.bind(this);
      this.connectToDevice = this.connectToDevice.bind(this);
    }

    async componentWillMount() {
      AppState.addEventListener('change', this.handleAppStateChange);
  
      this.BleManager.start({showAlert: false});
  
      this.handlerDiscover = this.bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
      this.handlerStop = this.bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
      this.handlerDisconnect = this.bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
      this.handlerConnect = this.bleManagerEmitter.addListener('BleManagerConnectPeripheral', this.handlerConnectPeripheral );
      this.handlerUpdate = this.bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );
  
      if (Platform.OS === 'android' && Platform.Version >= 23) {
          PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
              if (result) {
                console.log("Permission is OK");
              } else {
                PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                  if (result) {
                    console.log("User accept");
                  } else {
                    console.log("User refuse");
                  }
                });
              }
        });
      }
      
    }

    componentDidMount() {
      this._checkStoraggedPeripherals();
    }

    componentDidUpdate() {
      console.log(this.state.peripherals.size, this.state.scanning, this.props.connectedDevice)
      if (this.state.peripherals.size > 0 && this.state.scanning == false && this.state.connectedDevice == null) {
        this._checkStoraggedPeripherals('connect');
      }
    }

    async _checkStoraggedPeripherals(type = 'check') {
      const self = this;
      /* Get local storage to get last known peripheral and connect automatically with it */
      try {
        const peripheralsJson = await AsyncStorage.getItem('EsconaBot/lastConnected');
        if (peripheralsJson !== null) {
          switch (type) {
            case 'check':
              self.props.setLoading(true);
              self.startScan();
              break;
            case 'connect':
              const peripheralsValues = JSON.parse(peripheralsJson);
              let statePeripherals = this.state.peripherals;
              statePeripherals.forEach(function(elState, indexState){
                if (String(peripheralsValues.id) === String(elState.id)) {
                  let peripheralToConnect = elState;
                  peripheralToConnect.connect = true;
                  self.state.connectedDevice = elState;
                  self.connectToDevice(elState);
                  return false;
                }
              });
              break;
          }
        }
      } catch (error) {
        console.log(error)
      }
    }
  
    handleAppStateChange(nextAppState) {
      if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!')
        this.BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
          console.log('Connected peripherals: ' + peripheralsArray.length);
        });
      }
      this.setState({appState: nextAppState});
    }
  
    componentWillUnmount() {
      if (this.handlerDiscover) this.handlerDiscover.remove();
      if (this.handlerStop) this.handlerStop.remove();
      if (this.handlerDisconnect) this.handlerDisconnect.remove();
      if (this.handlerUpdate) this.handlerUpdate.remove();
    }
  
    handleDisconnectedPeripheral(data) {
      let peripherals = this.state.peripherals;
      let peripheral = peripherals.get(data.peripheral);
      if (peripheral) {
        peripheral.connected = false;
        peripherals.set(peripheral.id, peripheral);
        this.setState({peripherals});
        this.props.setDevice(null);
      }
      console.log('Disconnected from ' + data.peripheral);
    }
  
    handlerConnectPeripheral(peripheralId) {
    }
  
    handleUpdateValueForCharacteristic(data) {
      console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
    }
  
    handleStopScan() {
      console.log('Scan is stopped');
      this.setState({ scanning: false });
    }
  
    startScan() {
      if (!this.state.scanning) {
        this.setState({peripherals: new Map()});
        this.BleManager.scan([], 3, true).then((results) => {
          console.log('Scanning...');
          this.setState({scanning: true});
        });
      }
    }
  
    retrieveConnected(){
      this.BleManager.getConnectedPeripherals([]).then((results) => {
        console.log(results);
        var peripherals = this.state.peripherals;
        for (var i = 0; i < results.length; i++) {
          var peripheral = results[i];
          peripheral.connected = true;
          peripherals.set(peripheral.id, peripheral);
          this.setState({ peripherals });
        }
      });
    }
  
    handleDiscoverPeripheral(peripheral){
      var peripherals = this.state.peripherals;
      if (!peripherals.has(peripheral.id)){
        console.log('Got ble peripheral', peripheral);
        peripherals.set(peripheral.id, peripheral);
        this.setState({ peripherals })
        this.props.setPeripherals(peripherals);
      }
    }
  
    connectToDevice(peripheral) {
      const self = this;
      if (peripheral){
        if (peripheral.connected){
          this.BleManager.disconnect(peripheral.id);
        } else {
          this.BleManager.connect(peripheral.id).then(() => {
            let peripherals = this.state.peripherals;
            let connectedDevice = this.props.connectedDevice;
            let p = peripherals.get(peripheral.id);
            if (p) {
              p.connected = true;
              peripherals.set(peripheral.id, p);
              connectedDevice = peripheral;
              this.setState({peripherals, connectedDevice});
              this.props.setDevice(peripheral);
              this._setAsyncStorage(connectedDevice);
              this.props.setLoading(false);
            }
            console.log('Connected to ' + peripheral.id);
          }).catch((error) => {
            console.log('Connection error', error);
          });
        }
      }
    }
  
    async _setAsyncStorage(lastConnected) {
      try {
        await AsyncStorage.setItem('EsconaBot/lastConnected', JSON.stringify(lastConnected));
      } catch (error) {
        console.log(error)
      }
    }

    _renderRightButton = () => {
      const { scanning } = this.state;
      return(
        <View style={{right: 20, width: 50, height: 25}}>
        <TouchableOpacity style={{width: 30, height: 25, right: -20}} onPress={() => {!scanning && this.startScan()}}>
          { !scanning ? (<Icon name="update" size={28} />) : (<ActivityIndicator size="small" color="#333" />) }
        </TouchableOpacity>
        </View>
      );
    };

    render() {
      return (
        <Router>
          <Scene 
            key="root"
            window={window}
            BleManager={this.BleManager}
            bleManagerEmitter={this.bleManagerEmitter}
            connectToDevice={this.connectToDevice}
            {...this.state}
            >
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
              lazy
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
                right={() => this._renderRightButton()}
              />
            </Scene>
          </Scene>
        </Router>
      );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppRoot);