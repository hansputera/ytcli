import figlet from 'figlet';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Make inquirer filter data
 * @param {Function} callback callback function.
 * @return {Promise<string | boolean>}
 */
export async function makeInquirerFilter(callback) {
	if (typeof callback !== 'function') {
		throw new TypeError('Invalid \'callback\' type data');
	}
	return await new Promise((resolve, reject) => {
		if (callback instanceof Promise) {
			callback().then(resolve).catch(reject);
		} else {
			try {
				const calldata = callback();
				if (typeof calldata === 'boolean' || typeof calldata === 'string' ||
						typeof calldata === 'number') {
					resolve(calldata);
				} else {
					if (typeof calldata === 'function') {
						reject(calldata.name);
					} else {
						reject(JSON.stringify(calldata));
					}
				}
			} catch (e) {
				reject(e.message);
			}
		}
	});
}
/**
 * Get path data
 * @return {{__filename: string, __dirname: string}}
 */
export function getPathData() {
	const __filename = fileURLToPath(import.meta.url);
	return Object.freeze({
		__filename,
		__dirname: path.dirname(__filename),
	});
}

/**
 * Generate figlet text.
 * @param {string} text Figlet text
 * @param {Object} options Figlet options
 * @return {Promise<string>} figlet text
 */
export async function getFiglet(text, options) {
	return await new Promise((resolve, reject) => {
		figlet(text, { ...options }, (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}

/**
 * Get package.json data
 * @param {string?} key data key
 * @return {Object | string}
 */
export function getPackageData(key) {
	try {
		const data = JSON.parse(fs.readFileSync(
			path.join(getPathData().__dirname, 'package.json'), 'utf8'));
		if (typeof key === 'string') {
			return data[key] ?? data;
		} else {
			return data;
		}
	} catch {
		return {};
	}
}

/**
 * Create loading text
 * @param {string} text loading text.
 * @return {Promise<*>}
 */
export function createLoadingText(text) {
	const words = ['|', '/', '-', '\\', '#', '$', '%'];

	let i = 0;
	return setInterval(() => {
		i = (i > (words.length-1)) ? 0 : i;
		console.clear();
		console.log(words[i], text);
		i++;
	}, 300);
}
