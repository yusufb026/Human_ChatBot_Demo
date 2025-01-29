import { OpenAIWhisperAudio } from 'langchain/document_loaders/fs/openai_whisper_audio';
import { convertAudioToMp3 } from '../utils/audios.mjs';
import {
	audioFileToBase64,
	readJsonTranscript,
} from '../utils/files.mjs';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
global.require = require; //this will make require at the global scobe and treat it like the original require

//Open AI API and elevenLabsAPI key
const openAIApiKey = process.env.OPENAI_API_KEY;
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

async function convertAudioToText({ audioData }) {
	const mp3AudioData = await convertAudioToMp3({
		audioData,
	});
	const timestamp = Date.now();
	const outputPath = `/tmp/output_${timestamp}.mp3`;
	fs.writeFileSync(outputPath, mp3AudioData);
	const loader = new OpenAIWhisperAudio(outputPath, {
		clientOptions: { apiKey: openAIApiKey },
	});
	const doc = (await loader.load()).shift();
	const transcribedText = doc.pageContent;
	fs.unlinkSync(outputPath);
	return transcribedText;
}
export { convertAudioToText, sendDefaultMessages };

async function sendDefaultMessages({ userMessage }) {
	if (!userMessage) {
		res.send({
			messages: [
				{
					text: 'Hey there... How was your day?',
					audio: await audioFileToBase64({
						fileName: 'audios/intro_0.wav',
					}),
					lipsync: await readJsonTranscript({
						fileName: 'audios/intro_0.json',
					}),
					facialExpression: 'smile',
					animation: 'TalkingOne',
				},
				{
					text: "I'm Jack, your personal AI assistant. I'm here to help you with anything you need.",
					audio: await audioFileToBase64({
						fileName: 'audios/intro_1.wav',
					}),
					lipsync: await readJsonTranscript({
						fileName: 'audios/intro_1.json',
					}),
					facialExpression: 'smile',
					animation: 'TalkingTwo',
				},
			],
		});
		return true;
	}
	if (!elevenLabsApiKey || !openAIApiKey) {
		res.send({
			messages: [
				{
					text: "Please my friend, don't forget to add your API keys!",
					audio: await audioFileToBase64({
						fileName: 'audios/api_0.wav',
					}),
					lipsync: await readJsonTranscript({
						fileName: 'audios/api_0.json',
					}),
					facialExpression: 'angry',
					animation: 'TalkingThree',
				},
				{
					text: "You don't want to ruin Jack with a crazy ChatGPT and ElevenLabs bill, right?",
					audio: await audioFileToBase64({
						fileName: 'audios/api_1.wav',
					}),
					lipsync: await readJsonTranscript({
						fileName: 'audios/api_1.json',
					}),
					facialExpression: 'smile',
					animation: 'Angry',
				},
			],
		});
		return true;
	}
}