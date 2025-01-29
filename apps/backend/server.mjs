import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { openAIChain, parser } from "./modules/openAI.mjs";

import { lipSync } from "./modules/lip-sync.mjs";
import { convertAudioToText, sendDefaultMessages } from "./modules/whisper.mjs";
import logger from './utils/logger.mjs';

dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

logger.info('Starting API server');
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT;

async function processOpenAIFlow({ userMessage, isAudio = false, audioData }) {
    try {
        if (isAudio) {
            logger.info('Converting audio to text');
            userMessage = await convertAudioToText({ audioData });
            if (!userMessage) {
                logger.error('Audio conversion failed: No text returned');
                throw new Error('Failed to process audio data');
            }
            logger.info(`Converted audio to text: ${userMessage}`);
        }

        logger.info(`Processing user message: ${userMessage}`);

        const defaultResponseSent = await sendDefaultMessages({ userMessage });
        if (defaultResponseSent) {
            logger.info('Default message response sent');
            return { messages: null, defaultSent: true };
        }

        logger.info('Sending user message to OpenAI');
        let openAIMessages = await openAIChain.invoke({
            question: userMessage,
            format_instructions: parser.getFormatInstructions(),
        });
        logger.info('OpenAI messages retrieved');

        logger.info('Performing lip sync on OpenAI messages');
        openAIMessages = await lipSync({ messages: openAIMessages.messages });
        logger.info('Lip sync completed');

        return { messages: openAIMessages, defaultSent: false };
    } catch (error) {
        logger.error(`Error in processOpenAIFlow: ${error.message}`, { error });
        throw error;
    }
}

app.get("/voices", async (req, res) => {
    logger.info('Getting voices');
    res.send(await voice.getVoices(elevenLabsApiKey));
    logger.info('Voices retrieved');
});

app.post("/tts", async (req, res) => {
    try {
        logger.info('Received TTS request');

        const userMessage = req.body.message;
        if (!userMessage) {
            logger.error('Invalid request: Missing "message" in request body');
            return res.status(400).send({ error: 'Message is required' });
        }

        const { messages, defaultSent } = await processOpenAIFlow({ userMessage });
        if (defaultSent) {
            return res.status(200).send({ message: 'Default message sent' });
        }

        res.status(200).send({ messages });
        logger.info('TTS request processed successfully');
    } catch (error) {
        logger.error(`Error processing TTS request: ${error.message}`, { error });
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.post("/sts", async (req, res) => {
    try {
        logger.info('Received STS request');

        const base64Audio = req.body.audio;
        if (!base64Audio) {
            logger.error('Invalid request: Missing "audio" in request body');
            return res.status(400).send({ error: 'Audio data is required' });
        }

        const audioData = Buffer.from(base64Audio, "base64");
        if (!audioData || !audioData.length) {
            logger.error('Invalid request: Failed to decode base64 audio data');
            return res.status(400).send({ error: 'Invalid audio data' });
        }

        const { messages, defaultSent } = await processOpenAIFlow({ isAudio: true, audioData });
        if (defaultSent) {
            return res.status(200).send({ message: 'Default message sent' });
        }

        res.status(200).send({ messages });
        logger.info('STS request processed successfully');
    } catch (error) {
        logger.error(`Error processing STS request: ${error.message}`, { error });
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    logger.info(`Api is listening on port ${port}`);
});
