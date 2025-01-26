import fs from 'fs';
import { execCommand } from './files.mjs';
import logger from './logger.mjs';

async function convertAudioToMp3({ audioData }) {
	logger.info('Converting audio to mp3');
	const inputPath = '/tmp/input.webm';
	fs.writeFileSync(inputPath, audioData);
	const outputPath = '/tmp/output.mp3';
	await execCommand({
		command: `ffmpeg -i ${inputPath} ${outputPath}`,
	});
	const mp3AudioData = fs.readFileSync(outputPath);
	fs.unlinkSync(inputPath);
	fs.unlinkSync(outputPath);
	logger.info('Audio converted to mp3');
	return mp3AudioData;
}

export { convertAudioToMp3 };
