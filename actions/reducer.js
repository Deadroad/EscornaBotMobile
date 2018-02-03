export const initialState = {};

export default function (state = initialState, action) {
  switch (action.type) {
    case 'SET_DEVICE': {
      return {
        ...state,
        connectedDevice: action.data || null,
      };
    }
    break;
    case 'SET_PERIPHERALS': {
      return {
        ...state,
        peripherals: action.data || new Map(),
      };
    }
    break;
    case 'SET_LOADING': {
      return {
        ...state,
        loading: action.data || false,
      };
    }
    break;
    default:
      return state;
  }
}
