/**
 * # Make JS
 *
 *     foo.js ━┓
 *     bar.js ━┫
 *             ┗━ browserify-incremental
 *                ┗━ babelify
 *                   ┗━ errorify ━┓
 *                                ┣━ foo.js
 *                                ┣━ foo.js.map
 *                                ┣━ bar.js
 *                                ┗━ bar.js.map
 */

import { read, write } from 'spiff';

import browserify from 'browserify-incremental';

export default async function js(options) {
	const maps = options.m || options.maps;

	async function transpile(fileObj) {
		const results = [];
		const bundler = browserify(fileObj.path, { debug: maps })
			.plugin('errorify')
			.transform('envify')
			.transform('babelify', {
				presets: [
					'es2015',
					'stage-2',
				],
				plugins: [
					'add-module-exports',
				],
			});

		if (process.env.NODE_ENV === 'production') {
			bundler
				.transform('uglifyify', {
					global: true,
				});
		}

		await new Promise((resolve, reject) => {
			bundler
				.bundle()
				.on('data', chunk => results.push(chunk))
				.on('finish', resolve)
				.on('error', reject);
		});

		fileObj.contents = Buffer.concat(results);

		return fileObj;
	}

	return read('src/asset*/js/*.js')
		.map(transpile)
		.map(write('dist', {
			sourcemap: maps,
		}));
}