import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ListView,
  ScrollView,
  AppState,
  Dimensions,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import { Button, Icon, List, ListItem } from 'react-native-elements';

// Additional libs
import BleManager from 'react-native-ble-manager';

const window = Dimensions.get('window');
const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

class DevicesScreen extends Component {

  constructor(props) {
    super();
    this.props = props;
    this.state = {
      scanning: false,
      peripherals: new Map(),
      appState: '',
      devices: {},
      loading: false
    }

    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  componentWillMount() {
    Actions.refresh({ right: this._renderRightButton(false) });
    AppState.addEventListener('change', this.handleAppStateChange);

    BleManager.start({showAlert: false});

    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
    this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
    this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
    this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );

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

  handleAppStateChange(nextAppState) {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
      BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
        console.log('Connected peripherals: ' + peripheralsArray.length);
      });
    }
    this.setState({appState: nextAppState});
  }

  componentWillUnmount() {
    this.handlerDiscover.remove();
    this.handlerStop.remove();
    this.handlerDisconnect.remove();
    this.handlerUpdate.remove();
  }

  handleDisconnectedPeripheral(data) {
    let peripherals = this.state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      this.setState({peripherals});
      Actions.pad({connectedDevice: null, manager: null})
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  handleUpdateValueForCharacteristic(data) {
    console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({ scanning: false });
    Actions.refresh({ right: this._renderRightButton(false) });
  }

  startScan() {
    if (!this.state.scanning) {
      Actions.refresh({ right: this._renderRightButton(true) });
      this.setState({peripherals: new Map()});
      BleManager.scan([], 3, true).then((results) => {
        console.log('Scanning...');
        this.setState({scanning:true});
      });
    }
  }

  retrieveConnected(){
    BleManager.getConnectedPeripherals([]).then((results) => {
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
    }
  }

  connectToDevice(peripheral) {
    const self = this;
    this._renderRightButton(true);
    if (peripheral){
      if (peripheral.connected){
        BleManager.disconnect(peripheral.id);
      } else {
        BleManager.connect(peripheral.id).then(() => {
          let peripherals = this.state.peripherals;
          let p = peripherals.get(peripheral.id);
          if (p) {
            p.connected = true;
            peripherals.set(peripheral.id, p);
            this.setState({peripherals});
            this._renderRightButton(false);
            Actions.pad({connectedDevice: peripheral, manager: BleManager})
          }
          console.log('Connected to ' + peripheral.id);
        }).catch((error) => {
          console.log('Connection error', error);
        });
      }
    }
  }

  _renderRightButton = (loading) => {
    return(
      <View style={{right: 20, width: 50, height: 25}}>
      <TouchableOpacity style={{width: 30, height: 25, right: -20}} onPress={() => {!loading && this.startScan()}}>
      {/* <View style={{right: 20}}> */}
        { !loading ? (<Icon name="update" size={28} />) : (<ActivityIndicator size="small" color="#333" />) }
      {/* </View> */}
      </TouchableOpacity>
      </View>
    );
  };

  _keyExtractor = (item, index) => index

  _renderItem = ({item}) => {
    const icon = item.connected ? <Icon name='done' size={20} color='#04d804' /> : <Icon name='keyboard-arrow-right' size={20} />;
    return (item.name && <TouchableOpacity onPress={() => this.connectToDevice(item)}>
    <ListItem
      title={`${item.name}`}
      subtitle={`${item.id}`}
      id={`${item.id}`}
      key={`${item.id}`}
      rightIcon={icon}
      // onPress={() => this.connectToDevice(item)}
    />
    </TouchableOpacity>);
  }

  render() {
    const { devices } = this.state;
    const list = Array.from(this.state.peripherals.values());

    let returnView = <View style={styles.container}>
      {(list && list.length) ? ( 
        <List containerStyle={{ borderTopWidth: 0, borderBottomWidth: 0, width: '100%', flex: 3, marginTop: 0, paddingTop: 0 }}>
          <FlatList
            data={list}
            keyExtractor={this._keyExtractor}
            renderItem={this._renderItem}
          />
        </List>
      ) : (
        // <ActivityIndicator size="small" color="#333" />
        <Text>Push top right button to scan peripherals</Text>
      )
      }
    </View>;
    return (returnView);
  }
}

const styles = StyleSheet.create({
  container: {
    top: 0,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row'
  }
});

export default DevicesScreen;