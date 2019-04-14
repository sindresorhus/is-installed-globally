import {expectType} from 'tsd';
import isInstalledGlobally = require('.');

expectType<boolean>(isInstalledGlobally);
