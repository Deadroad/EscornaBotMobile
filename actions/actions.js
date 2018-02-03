export function setDevice(peripheral) {
  return ({
    type: 'SET_DEVICE',
    data: peripheral,
  });
}

export function setPeripherals(peripherals) {
  return ({
    type: 'SET_PERIPHERALS',
    data: peripherals,
  });
}

export function setLoading(status) {
  return ({
    type: 'SET_LOADING',
    data: status,
  });
}