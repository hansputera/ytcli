import inquirer from 'inquirer';
import chalk from 'chalk';
import ytdl from 'youtube-dl-exec';
import fs from 'node:fs';
import path from 'node:path';

import {
	getFiglet,
	getPackageData,
	makeInquirerFilter,
	createLoadingText,
	getPathData
} from './util.js';
import { getVideos } from './lib.js';

if (!fs.existsSync(getPathData().__dirname, '_videos')) {
	fs.mkdirSync(getPathData().__dirname, '_videos');
}

/**
 * Ask user to confirm yes/no
 * @param {string} message confirmation message
 * @return {Promise<boolean>}
 */
export async function confirmAsk(message) {
	const answers = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'confirmation',
			message,
		}
	]);

	return answers.confirmation;
}
/**
 * Print banner.
 * @param {string?} prop Chalk property
 * @return {Promise<void>}
 */
async function printBanner(prop = 'cyan') {
	const metadata = getPackageData();
	console.log(chalk[prop](await getFiglet(
		metadata.name, {
			width: 50,
		})));
	console.log(chalk.blue.italic('	Version: v' + metadata.version));
	console.log(chalk.bold.white.italic('	Author:'), chalk.white(metadata.author));
	console.log(chalk.yellow('	Dependencies:', chalk.white(Object.keys(metadata.dependencies).join(', '), '\n')));
}

/**
 * Ask query (video query, video limits, and video type)
 * @return {Promise<void>}
 */
async function askQuery() {
	await printBanner();

	const answers = await inquirer.prompt([
		{
			type: 'input',
			name: 'query',
			message: 'Type video name or search query:',
			filter: (value) => makeInquirerFilter(() => {
				if (value.length >= 1 && value.length <= 1e5) {
					return value;
				} else {
					throw new TypeError('Invalid query');
				}
			}),
		}, {
			type: 'number',
			name: 'limit',
			message: 'Video search limits',
			default: 10,
			filter: (value) => makeInquirerFilter(() => {
				if (value >= 1 && value <= 100) {
					return value;
				} else {
					throw new TypeError('Invalid limits');
				}
			}),
		}, {
			type: 'list',
			name: 'type',
			message: 'Filter video type',
			default: 'video',
			choices: ['video', 'live-stream']
		}
	]);

	searchVideoQuery(answers);
}

/**
 * Search video query function
 * @param {Object} data asked data
 * @return {Promise<void>}
 */
async function searchVideoQuery(data) {
	console.clear(); // clear the console.
	await printBanner('magenta'); // print banner

	const loadingtext = createLoadingText(
		chalk.yellow.bold('Searching ...'));

	const videos = await getVideos(data.query, data.limits, data.type);
	clearInterval(loadingtext);

	if (!videos.length) {
		console.log(chalk.bold.red('The results is empty!'));

		if (await confirmAsk('Try again?')) {
			console.clear();
			askQuery();
		} else {
			console.clear();
			console.log(chalk.white.bold('Bye.'));
		}
	} else {
		console.clear();
		console.log(chalk.blue.italic('[+] Found', videos.length, 'videos.'));
		
		const answers = await inquirer.prompt([
			{
				type: 'list',
				name: 'video',
				message: 'Select videos bellow to download!',
				choices: videos.map((video) => video.title),
			}
		]);

		const video = videos.find((v) => v.title === answers.video);
		showVideoQuery(video);
	}
}

/**
 * Video query menu
 * @param {Object} video Video data
 * @return {Promise<void>}
 */
export async function showVideoQuery(video) {
	console.clear();
	await printBanner();

	console.log(chalk.yellow.italic('Video ID:', chalk.white.bold(video.id)));
	console.log(chalk.yellow.italic('Title:', chalk.white.bold(video.title)));
	console.log(chalk.yellow.italic('URL:', chalk.cyan.bold('https://youtube.com/watch?v=' + video.id)));
	console.log(chalk.yellow.italic('Uploaded:', chalk.white.bold(video.uploaded)));
	console.log(chalk.yellow.italic('Uploaded by', chalk.white.bold(video.channel.name)));
	console.log('\n' + chalk.white(video.description), '\n\n');

	const answers = await inquirer.prompt([
			{
				type: 'list',
				name: 'type',
				message: 'Select video type bellow:',
				choices: ['mp3', 'mp4', 'webm'],
				default: 'mp3'
			}
	]);

	ytdl.exec('https://youtube.com/watch?v=' + video.id, {
		noWarnings: true,
	    noCallHome: true,
	    noCheckCertificate: true,
	    preferFreeFormats: true,
	    format: answers.type,
	    output: path.join(getPathData().__dirname, '_videos', video.title.replace(/\//g, '-') + '.' + answers.type),
	});

	console.log(chalk.green.bold('Downloading ...'));
	process.on('exit', () => {
		console.log('done.');
	});
}

askQuery(); // begin
