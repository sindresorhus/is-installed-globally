import path from 'node:path';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
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

for (const relativePath of ['projects/v1.2.3/node_modules/is-installed-globally', 'projects/my-app/lib/node_modules/is-installed-globally']) {
	test(`local path: ${relativePath}`, async t => {
		await makeDirectory('.ai-temporary');
		const temporaryDirectory = await fs.mkdtemp(path.resolve('.ai-temporary/install-'));

		try {
			const packageDirectory = path.join(temporaryDirectory, relativePath);
			await makeDirectory(packageDirectory);
			await cpy('index.js', packageDirectory);
			await fs.writeFile(path.join(packageDirectory, 'package.json'), '{"type": "module"}');
			const {default: installedGlobally} = await import(pathToFileURL(path.join(packageDirectory, 'index.js')).href);
			t.false(installedGlobally);
		} finally {
			await deleteAsync(temporaryDirectory, {force: true});
		}
	});
}

test('nvm global from another Node version', async t => {
	await makeDirectory('.ai-temporary');
	const temporaryDirectory = await fs.mkdtemp(path.resolve('.ai-temporary/install-'));

	try {
		const nvmDirectory = path.join(temporaryDirectory, '.nvm');
		const packageDirectory = path.join(nvmDirectory, 'versions/node/v1.2.3/lib/node_modules/is-installed-globally');
		await makeDirectory(packageDirectory);
		await cpy('index.js', packageDirectory);
		await fs.writeFile(path.join(packageDirectory, 'package.json'), '{"type": "module"}');
		const packageUrl = pathToFileURL(path.join(packageDirectory, 'index.js')).href;
		const {stdout} = await execa('node', ['--input-type=module', '-e', 'const {default: installedGlobally} = await import(process.argv[1]); console.log(installedGlobally);', packageUrl], {env: {NVM_DIR: nvmDirectory}});
		t.is(stdout, 'true');
	} finally {
		await deleteAsync(temporaryDirectory, {force: true});
	}
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
