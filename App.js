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
    AsyncStorage,
    Alert
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

const seconds = 9999;

const TabIcon = ({ selected, title }) => {
    let icon = null;
    switch (title) {
      case 'Keypad':
        icon = <Icon name="all-out" size={28}
        accessibilityLabel={'Keypad'} />;
        break;
      case 'Devices':
        icon = <Icon name="settings-bluetooth" size={28}
        accessibilityLabel={'Dispositivos'} />;
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
        peripherals: this.props.peripherals,
        state: false,
        scanning: false,
        appState: '',
        loading: false,
        enabledAlert : false,
        enabledBluetooth: true,
        from: '',
      }

      this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
      this.handleStopScan = this.handleStopScan.bind(this);
      this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
      this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
      this.handlerConnectPeripheral = this.handlerConnectPeripheral.bind(this);
      this.handleAppStateChange = this.handleAppStateChange.bind(this);
      this.connectToDevice = this.connectToDevice.bind(this);
      this.bleUpdateStateBt = this.bleUpdateStateBt.bind(this);
      this.startScan = this.startScan.bind(this);
      this.stopScan = this.stopScan.bind(this);
    }

    componentWillMount() {
      AppState.addEventListener('change', this.handleAppStateChange);
  
      this.BleManager.start({showAlert: false});
  
      this.handlerDiscover = this.bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
      this.handlerStop = this.bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
      this.handlerDisconnect = this.bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
      this.handlerConnect = this.bleManagerEmitter.addListener('BleManagerConnectPeripheral', this.handlerConnectPeripheral );
      this.handlerUpdate = this.bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );
      this.bleUpdateState = this.bleManagerEmitter.addListener('BleManagerDidUpdateState', this.bleUpdateStateBt );
  
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

    componentDidUpdate() {
      const { enabledBluetooth, scanning } = this.state;

      if (enabledBluetooth) {
        switch (Actions.currentScene) {
          case '_pad':
            if (scanning) this.stopScan();
            break;
          case '_devices':
            if (!scanning) this.startScan();
            break;
        }
      }
    }

    _checkStoragedPeripherals(peripheral) {
      const self = this;
      /* Get local storage to get last known peripheral and connect automatically with it */
      try {
        AsyncStorage.getItem('EsconaBot/lastConnected')
        .then((value) => {
          let peripheralsJson = value;
          console.log('AsyncStorage', peripheralsJson);
          if (peripheralsJson !== null && peripheral) {
            const peripheralsValues = JSON.parse(peripheralsJson);
            if (String(peripheralsValues.id) === String(peripheral.id)) {
              peripheralsValues.connected = true;
              self.connectToDevice(peripheral);
            }
          }
        }).done();
      } catch (error) {
        console.log(error)
      }
    }
  
    handleAppStateChange(nextAppState) {
      const self = this;
      if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!')
        this.BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
          console.log('Connected peripherals: ' + peripheralsArray.length);
          if (peripheralsArray.length === 0) {
            this.BleManager.checkState();
          }
        });
      }
      this.setState({appState: nextAppState});
    }

    bleUpdateStateBt(state) {
      const self = this;
      console.log('bleUpdateStateBt', state)
      if ((state.state === 'off' || state.state === 'turning_off') && !this.state.enabledAlert) {
        if (Actions.currentScene === '_devices') this.stopScan();
        this.setState({enabledBluetooth: false});
        this.props.setDevice(null);
        this.props.setPeripherals(new Map());
        this.setState({enabledAlert : true});
        Alert.alert(
          'Information',
          'Please, enable Bluetooth!',
          [
            {text: 'OK', onPress: () => self.setState({enabledAlert: false})},
          ],
          { cancelable: false }
        );
      }
      if (state.state === 'on' || state.state === 'turning_on') {
        this.setState({enabledBluetooth: true});
        if (Actions.currentScene === '_pad') Actions.devices();
      }
    }
  
    componentWillUnmount() {
      if (this.handlerDiscover) this.handlerDiscover.remove();
      if (this.handlerStop) this.handlerStop.remove();
      if (this.handlerDisconnect) this.handlerDisconnect.remove();
      if (this.handlerUpdate) this.handlerUpdate.remove();
      this.setState({from: '', connectedDevice: null});
    }
  
    /* Android: al desconectar parece que no refresca el state.connectedDevice o elimina el item de AsyncStorage */
    async handleDisconnectedPeripheral(data) {
      let peripherals = this.state.peripherals;
      let peripheral = peripherals.get(data.peripheral);
      if (peripheral) {
        this.props.setDevice(null);
        if (this.state.from === 'devicesScreen') await AsyncStorage.removeItem('EsconaBot/lastConnected');
        peripheral.connected = false;
        peripherals.set(peripheral.id, peripheral);
        this.setState({peripherals, from: '', connectedDevice: null});
        if (Actions.currentScene === '_pad') Actions.devices();
        if (Actions.currentScene === '_devices') this.startScan();
      }
      console.log('Disconnected from ' + data.peripheral);
    }
  
    handlerConnectPeripheral(peripheral) {
      const self = this;
      if (peripheral){
        self.setState({ from: '' });
        Actions.pad();
      }
    }
  
    handleUpdateValueForCharacteristic(data) {
      console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
    }
  
    handleStopScan() {
      console.log('Scan is stopped');
      this.setState({ scanning: false });
    }

    stopScan() {
      if (this.state.scanning) {
        this.BleManager.stopScan().then(() => {
          console.log('Scan is manually stopped');
          this.setState({scanning: false});
        });
      }
    }
  
    startScan() {
      if (!this.state.scanning) {
        this.setState({peripherals: new Map(), scanning: true});
        this.BleManager.scan([], seconds, true).then(() => {
          console.log('Scanning...');
          this.setState({scanning: true});
        });
      }
    }
  
    handleDiscoverPeripheral(peripheral){
      var peripherals = this.state.peripherals;
      if (!peripherals.has(peripheral.id)){
        console.log('Got BLE peripheral', peripheral, this.state);
        let connectedDevice = this.state.connectedDevice;
        if (connectedDevice) {
          connectedDevice.connected = true;
          peripherals.set(connectedDevice.id, connectedDevice);
        }
        peripherals.set(peripheral.id, peripheral);
        this.setState({ peripherals })
        this.props.setPeripherals(peripherals);
        if (this.state.from !== 'devicesScreen') this._checkStoragedPeripherals(peripheral);
      }
    }
  
    connectToDevice(peripheral, from = 'empty') {
      const self = this;
      this.setState({from});
      if (peripheral){
        if (peripheral.connected){
          this.BleManager.disconnect(peripheral.id);
        } else {
          /* If there is another previous connected device, first disconnect */
          if (this.state.connectedDevice !== null) {
            this.BleManager.disconnect(this.state.connectedDevice.id)
            .then(() => {
              self.successfulConnect(peripheral, from);
            });
          } else {
            this.successfulConnect(peripheral, from);
          }
        }
      }
    }

    successfulConnect(peripheral, from = 'empty') {
      this.BleManager.connect(peripheral.id).then(() => {
        let peripherals = this.state.peripherals;
        let connectedDevice = this.state.connectedDevice;
        let p = peripherals.get(peripheral.id);
        if (p) {
          p.connected = true;
          console.log('successfulConnect', p)
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
  
    _setAsyncStorage(lastConnected) {
      try {
        AsyncStorage.setItem('EsconaBot/lastConnected', JSON.stringify(lastConnected));
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
            enabledBluetooth={this.state.enabledBluetooth}
            {...this.state}
            >
            <Scene
              key="tabbar"
              tabs
              tabBarStyle={{ backgroundColor: '#FFFFFF', height: 54 }}
              activeBackgroundColor="#fffc9e"
              inactiveBackgroundColor="transparent"
              activeTintColor="#fff"
              inactiveTintColor="#333"
              tabBarPosition="bottom"
              showIcon={true}
              showLabel={false}
              lazy
              accessible={true}
              >
              <Scene
                key="pad"
                component={PadScreen}
                title="Keypad"
                icon={TabIcon}
              />
              <Scene
                initial
                key="devices"
                component={DevicesScreen}
                title="Devices"
                icon={TabIcon}
                // right={() => this._renderRightButton()}
              />
            </Scene>
          </Scene>
        </Router>
      );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppRoot);