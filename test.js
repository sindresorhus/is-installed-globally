import path from 'node:path';
import test from 'ava';
import {execa} from 'execa';
import globalDirectory from 'global-directory';
import {deleteAsync} from 'del';
import makeDirectory from 'make-dir';
import cpy from 'cpy';
/// import packageJson from './package.json';
/// import fixturePackageJson from './fixture/package.json';
import isInstalledGlobally from './index.js';

const npm = async arguments_ => {
	const {stdout} = await execa('npm', arguments_, {cwd: 'fixture'});
	return stdout;
};

test.before(async () => {
	await npm(['unlink', 'is-installed-globally_fixture']);
});

test.after.always(async () => {
	await npm(['unlink', 'is-installed-globally_fixture']);
});

// FIXME
// test.serial('regression: missing global directory', t => {
// 	const packages = '/some/non-existing/path';
// 	delete require.cache[require.resolve('.')];
// 	const clone = JSON.parse(JSON.stringify(globalDirs));
// 	Object.assign(globalDirs, {yarn: {packages}, npm: {packages}});
// 	t.false(isInstalledGlobally);
// 	Object.assign(globalDirs, clone);
// });

test('local', t => {
	t.false(isInstalledGlobally);
});

test('global', async t => {
	await npm(['link']);

	const fixtureGlobalPath = path.join(
		globalDirectory.npm.packages,
		/// fixturePackageJson.name,
		'is-installed-globally-fixture', // Inlined for now.
	);

	const isInstalledGloballyGlobalPathInFixture = path.join(
		fixtureGlobalPath,
		'node_modules',
		/// packageJson.name,
		'is-installed-globally', // Inlined for now.
	);

	await deleteAsync(fixtureGlobalPath, {force: true});
	await makeDirectory(isInstalledGloballyGlobalPathInFixture);
	await cpy(['./**/*'], fixtureGlobalPath, {
		cwd: 'fixture',
		followSymlinkedDirectories: false,
		parents: true,
	});

	await cpy(['./**/*'], isInstalledGloballyGlobalPathInFixture, {
		followSymlinkedDirectories: false,
		parents: true,
	});

	const {stdout} = await execa('is-installed-globally-fixture');
	t.is(stdout, 'true');

	await deleteAsync(fixtureGlobalPath, {force: true});
});
