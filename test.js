import test from 'ava';
import execa from 'execa';
import m from '.';

test('local', t => {
	t.false(m);
});

test('global', async t => {
	const npm = args => execa('npm', args, {cwd: 'fixture'});
	await npm(['install', '--global', '.']);

	t.is(await execa.stdout('is-installed-globally-fixture'), 'true');

	await npm(['uninstall', '--global', '.']);
});
