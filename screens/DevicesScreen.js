import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  ListView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import { Button, Icon, List, ListItem } from 'react-native-elements';

// Actions
import * as AppActions from '../actions/actions';

const mapStateToProps = state => ({
  connectedDevice: state.connectedDevice || null,
  peripherals: state.peripherals || new Map(),
  loading: state.loading || false,
});

class DevicesScreen extends Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.BleManager = this.props.BleManager;
    this.bleManagerEmitter = this.props.bleManagerEmitter;
    this.state = {
      scanning: this.props.scanning,
      peripherals: this.props.peripherals,
      connectedDevice: this.props.connectedDevice,
      appState: this.props.appState,
    }
  }

  _keyExtractor = (item, index) => index

  _renderItem = ({item}) => {
    const icon = item.connected ? <Icon name='done' size={20} color='#04d804' /> : <Icon name='keyboard-arrow-right' size={20} />;
    const titleList = item.connected ? item.name + ' conectado' : item.name;
    return (item.name && <TouchableOpacity onPress={() => this.props.connectToDevice(item, 'devicesScreen')}
    accessible={true}
    accessibilityLabel={`${titleList}`}
    >
    <ListItem
      title={`${item.name}`}
      subtitle={`${item.id}`}
      id={`${item.id}`}
      key={`${item.id}`}
      rightIcon={icon}
    />
    </TouchableOpacity>);
  }

  render() {
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
        null
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

export default connect(mapStateToProps)(DevicesScreen);