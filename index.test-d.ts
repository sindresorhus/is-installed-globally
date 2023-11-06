import {expectType} from 'tsd';
import isInstalledGlobally from './index.js';

expectType<boolean>(isInstalledGlobally);
