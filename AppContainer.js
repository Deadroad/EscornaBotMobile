import React from 'react';
import { applyMiddleware, compose, createStore } from 'redux';
import { connect, Provider } from 'react-redux';
import { createLogger } from 'redux-logger';
// import thunk from 'redux-thunk';
import { Router } from 'react-native-router-flux';

import rootReducer from './actions/reducer';

import AppRoutes from './App'

// Connect RNRF with Redux
const RouterWithRedux = connect()(Router);

// Load middleware
let middleware = [
  // thunk, // Allows action creators to return functions (not just plain objects)
];

middleware = [
  ...middleware,
  createLogger(), // Logs state changes to the dev console
];

// Init redux store (using the given reducer & middleware)
const store = compose(
  applyMiddleware(...middleware),
)(createStore)(rootReducer);

/* Component ==================================================================== */
// Wrap App in Redux provider (makes Redux available to all sub-components)
export default function AppContainer() {
  return (
    <Provider store={store}>
      <RouterWithRedux scenes={AppRoutes} />
    </Provider>
  );
}
