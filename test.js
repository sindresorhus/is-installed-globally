import path from 'path';
import test from 'ava';
import execa from 'execa';
import globalDirs from 'global-dirs';
import del from 'del';
import makeDir from 'make-dir';
import cpy from 'cpy';
/* eslint-disable import/extensions */
import packageJson from './package.json';
import fixturePackageJson from './fixture/package.json';
/* eslint-enable import/extensions */
import isInstalledGlobally from '.';

test('local', t => {
	t.false(isInstalledGlobally);
});

test('global', async t => {
	const npm = args => execa('npm', args, {cwd: 'fixture'});
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

	t.is(await execa.stdout('is-installed-globally-fixture'), 'true');

	await del(fixtureGlobalPath, {force: true});
});
