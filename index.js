/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import NotificationService from './src/service/NotificationService';

NotificationService.init();

AppRegistry.registerComponent(appName, () => App);
