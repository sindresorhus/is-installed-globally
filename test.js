import path from 'path';
import test from 'ava';
import execa from 'execa';
import globalDirs from 'global-dirs';
import del from 'del';
import makeDir from 'make-dir';
import cpy from 'cpy';
import packageJson from './package.json';
import fixturePackageJson from './fixture/package.json';
import isInstalledGlobally from '.';

test.serial('local', t => {
	t.false(isInstalledGlobally);
});

test.serial('missing global folder', t => {
	const packages = '/some/non-existing/path';
	delete require.cache[require.resolve('.')];
	const clone = JSON.parse(JSON.stringify(globalDirs));
	Object.assign(globalDirs, {yarn: {packages}, npm: {packages}});
	t.false(isInstalledGlobally);
	Object.assign(globalDirs, clone);
});

test('global', async t => {
	const npm = async arguments_ => {
		const {stdout} = await execa('npm', arguments_, {cwd: 'fixture'});
		return stdout;
	};

	await npm(['install', '--global', '.']);

	const fixtureGlobalPath = path.join(
		globalDirs.npm.packages,
		fixturePackageJson.name
	);
	const isInstalledGloballyGlobalPathInFixture = path.join(
		fixtureGlobalPath,
		'node_modules',
		packageJson.name
	);
	await del(fixtureGlobalPath, {force: true});
	await makeDir(isInstalledGloballyGlobalPathInFixture);
	await cpy(['./**/*'], fixtureGlobalPath, {
		cwd: 'fixture',
		followSymlinkedDirectories: false,
		parents: true
	});
	await cpy(['./**/*'], isInstalledGloballyGlobalPathInFixture, {
		followSymlinkedDirectories: false,
		parents: true
	});

	const {stdout} = await execa('is-installed-globally-fixture');
	t.is(stdout, 'true');

	await del(fixtureGlobalPath, {force: true});
});
