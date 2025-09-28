import { registerRootComponent } from 'expo';
import App from './App';
// import * as Sentry from '@sentry/react-native';

// Sentry.init({
//   dsn: 'DSN',
// });

// registerRootComponent(Sentry.wrap(App));

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

registerRootComponent(App);
