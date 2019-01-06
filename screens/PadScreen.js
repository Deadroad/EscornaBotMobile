import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { createIconSetFromFontello } from 'react-native-vector-icons';
import fontelloConfig from './config.json';

// Extra libs
import { stringToBytes } from 'convert-string';

const mapStateToProps = (state, action) => ({
  connectedDevice: state.connectedDevice || null,
  peripherals: state.peripherals || new Map(),
  loading: state.loading || false,
});

const EscornabotIcon = createIconSetFromFontello(fontelloConfig);

class PadScreen extends Component {

  static defaultProps = {
    connectedDevice: null,
  }

  constructor(props) {
    super(props);
    this.props = props;
    this.manager = this.props.BleManager;
    this.state = {
      connectedDevice: this.props.connectedDevice,
      service: null,
      characteristic: null,
      connectingLast: this.props.loading,
      type: '',
      enabledBluetooth: this.props.enabledBluetooth
    }
    if (this.props.connectedDevice!=null){
      this.connectDevice(this.props.connectedDevice, this.manager);
    }
  }

  connectDevice(device, manager) {
    const self = this;
    this.manager.retrieveServices(device.id).then((peripheralInfo) => {
      peripheralInfo.characteristics.map((characteristic, index) => {
        let propertiesArray = new Array();
        for (let i in characteristic.properties) {
          propertiesArray.push(characteristic.properties[i]);
        }
        if (propertiesArray.includes('WriteWithoutResponse') && 
          !propertiesArray.includes('Write') && 
          !propertiesArray.includes('Read') && propertiesArray.length == 1){
          this.setState({
            service: characteristic.service,
            characteristic: characteristic.characteristic,
            type: 'WriteWithoutResponse'
          });
        }
        if (propertiesArray.includes('Write')){
          this.setState({
            service: characteristic.service,
            characteristic: characteristic.characteristic,
            type: 'Write'
          });
        }
      });
    });
  }

  onPressButtons(button) {
    const self = this;
    let valueToSend = stringToBytes(button+'\n');
    console.log('Started notification on ' + this.state.connectedDevice.id);
    if (this.state.service!==null && this.state.characteristic!==null){
      if (this.state.type == 'Write') {
        this.manager.write(this.state.connectedDevice.id, this.state.service, this.state.characteristic, valueToSend).then(() => {
          console.log('Value '+valueToSend+' sent!');
        }).catch((error) => {
          console.log(error);
        });
      } else {
        this.manager.writeWithoutResponse(this.state.connectedDevice.id, this.state.service, this.state.characteristic, valueToSend).then(() => {
          console.log('Value '+valueToSend+' sent!');
        }).catch((error) => {
          console.log(error);
        });
      }
    }
  }

  render() {
    const { connectedDevice, connectingLast, enabledBluetooth } = this.state;
    return (
      <View style={styles.container}>
        <View style={{position: 'absolute', top: 20}}><Text><Text style={{fontWeight: 'bold'}}>{connectedDevice ? connectedDevice.name : 'No device connected'}</Text> {connectedDevice ? 'connected' : null}</Text></View>
        {connectedDevice && 
        <View style={styles.container}>
          <View>
            <TouchableOpacity style={[styles.buttons, styles.n]} onPress={() => this.onPressButtons('n')}
            onLongPress={() => this.onPressButtons('nn')}
            accessible={true}
            accessibilityLabel={'Avanzar'}
            >
              {/* <Icon name="keyboard-arrow-up" size={28} /> */}
              <EscornabotIcon name="n" size={60} style={styles.escornaboticon} />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.buttons, styles.w]} onPress={() => this.onPressButtons('w')}
            onLongPress={() => this.onPressButtons('ww')}
            accessible={true}
            accessibilityLabel={'Girar a la izquierda'}
            >
              {/* <Icon name="keyboard-arrow-left" size={28} /> */}
              <EscornabotIcon name="w" size={60} style={styles.escornaboticon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttons, styles.g]} onPress={() => this.onPressButtons('g')}
            onLongPress={() => this.onPressButtons('gg')}
            accessible={true}
            accessibilityLabel={'Ejecutar'}
            >
              {/* <Text style={{color:'#FFF', fontWeight: 'bold', fontSize: 24}}>GO</Text> */}
              <EscornabotIcon name="g" size={60} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttons, styles.e]} onPress={() => this.onPressButtons('e')}
            onLongPress={() => this.onPressButtons('ee')}
            accessible={true}
            accessibilityLabel={'Girar a la derecha'}
            >
              {/* <Icon name="keyboard-arrow-right" size={28} /> */}
              <EscornabotIcon name="e" size={60} style={styles.escornaboticon} />
            </TouchableOpacity>
          </View>
          <View accessible={true}>
            <TouchableOpacity style={[styles.buttons, styles.s]} onPress={() => this.onPressButtons('s')}
            onLongPress={() => this.onLongPressButtons('ss')}
            accessible={true}
            accessibilityLabel={'Retroceder'}
            >
              {/* <Icon name="keyboard-arrow-down" size={28} /> */}
              <EscornabotIcon name="s" size={60} style={styles.escornaboticon} />
            </TouchableOpacity>
          </View>
        </View>
        }
        {(connectingLast && enabledBluetooth) &&
        <View style={[styles.container]} accessible={true}>
          <ActivityIndicator size="small" color="#333" />
          <Text style={{marginTop:10}}>Connecting last known peripheral...</Text>
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
    marginLeft: 5,
    borderRadius: 50,
    borderWidth: 1
  },
  g: {
    backgroundColor: 'white',
  },
  n: {
    backgroundColor: 'blue',
  },
  s: {
    backgroundColor: 'yellow',
  },
  w: {
    backgroundColor: 'red',
  },
  e: {
    backgroundColor: 'green',
  },
  escornaboticon: {
    color: '#FFF'
  },
  row: {
    flexDirection: 'row'
  }
});

export default connect(mapStateToProps)(PadScreen);