import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import globalDirectory from 'global-directory';
import isPathInside from 'is-path-inside';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve symlinks so version-manager proxies (like nvm-windows) compare correctly.
const realDirectory = (() => {
	try {
		return fs.realpathSync(__dirname);
	} catch {
		return __dirname;
	}
})();

const isInside = parent => {
	try {
		return isPathInside(realDirectory, fs.realpathSync(parent));
	} catch {
		return false;
	}
};

// `global-directory` only knows the active Node version's directory, but nvm
// scopes globals per version, so after `nvm use <other-version>` a global
// install would wrongly report `false`. Match package paths relative to the
// nvm installation root, so similarly named project directories stay local.
const isNvmGlobal = (process.env.NVM_DIR ? /^versions[/\\]node[/\\]v\d+\.\d+\.\d+[/\\]lib[/\\]node_modules[/\\]/i.test(path.relative(process.env.NVM_DIR, realDirectory)) : false)
	|| (process.env.NVM_HOME ? /^v\d+\.\d+\.\d+[/\\]node_modules[/\\]/i.test(path.relative(process.env.NVM_HOME, realDirectory)) : false);

const isInstalledGlobally = (() => {
	try {
		return isInside(globalDirectory.yarn.packages) || isInside(globalDirectory.npm.packages) || isNvmGlobal;
	} catch {
		return false;
	}
})();

export default isInstalledGlobally;
