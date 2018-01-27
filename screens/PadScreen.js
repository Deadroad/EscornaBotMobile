import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Button, Icon } from 'react-native-elements';

// Extra libs
import { stringToBytes } from 'convert-string';

const hexButtons = {
  'n': '6e',
  's': '73',
  'w': '77',
  'e': '65',
  'g': '67',
  'nl': '0a'
};

class PadScreen extends Component {

  constructor(props) {
    super();
    this.props = props;
    this.manager = null;
    this.state = {
      connectedDevice: null,
      service: null,
      characteristic: null
    }
  }

  componentWillReceiveProps(props) {
    this.props = props;
    this.manager = this.props.manager;
    this.setState({connectedDevice: this.props.connectedDevice});
    if (this.props.connectedDevice!=null){
      this.connectedDevice(this.props.connectedDevice, this.props.manager);
    }
  }

  connectedDevice(device, manager) {
    const self = this;
    this.manager.retrieveServices(device.id).then((peripheralInfo) => {
      peripheralInfo.characteristics.map((characteristic, index) => {
        if (Platform.OS === 'ios') {
          if (characteristic.properties.indexOf('WriteWithoutResponse')!=-1 ||
              characteristic.properties.indexOf('Notify')!=-1) {
            this.setState({
              service: characteristic.service,
              characteristic: characteristic.characteristic,
            });
          }
        }
        if (Platform.OS === 'android') {
          for (let i in characteristic.properties) {
            if (characteristic.properties[i] === 'WriteWithoutResponse' || characteristic.properties[i] === 'Notify') {
              this.setState({
                service: characteristic.service,
                characteristic: characteristic.characteristic,
              });
              break;
            }
          }
        }
      });
    });
  }

  onPressButtons(button) {
    const self = this;
    // let valueToSend = base64.encode(button+'\n');
    let valueToSend = stringToBytes(button+'\n');
    this.manager.startNotification(this.state.connectedDevice.id, this.state.service, this.state.characteristic).then(() => {
      console.log('Started notification on ' + this.state.connectedDevice.id);
      this.manager.write(this.state.connectedDevice.id, this.state.service, this.state.characteristic, valueToSend).then(() => {
        console.log('Value '+valueToSend+' sended!');
      });
    });
  }

  render() {
    const { connectedDevice } = this.state;
    return (
      <View style={styles.container}>
        <View style={{position: 'absolute', top: 20}}><Text>Now connected: <Text style={{fontWeight: 'bold'}}>{connectedDevice ? connectedDevice.name : 'No device connected'}</Text></Text></View>
        {connectedDevice && 
        <View style={styles.container}>
          <View>
            <TouchableOpacity style={styles.buttons} onPress={() => this.onPressButtons('n')}>
              <Icon name="keyboard-arrow-up" size={28} />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={styles.buttons} onPress={() => this.onPressButtons('w')}>
              <Icon name="keyboard-arrow-left" size={28} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.okButton} onPress={() => this.onPressButtons('g')}>
              <Text style={{color:'#FFF', fontWeight: 'bold', fontSize: 24}}>GO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttons} onPress={() => this.onPressButtons('e')}>
              <Icon name="keyboard-arrow-right" size={28} />
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity style={styles.buttons} onPress={() => this.onPressButtons('s')}>
              <Icon name="keyboard-arrow-down" size={28} />
            </TouchableOpacity>
          </View>
        </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttons: {
    width: 70,
    height: 70,
    backgroundColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
    marginRight: 5,
    marginLeft: 5
  },
  okButton: {
    width: 70,
    height: 70,
    backgroundColor: '#25d225',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
    marginRight: 5,
    marginLeft: 5,
  },
  row: {
    flexDirection: 'row'
  }
});

export default PadScreen;