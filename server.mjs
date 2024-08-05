import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'fs';
import { parse, stringify } from 'flatted';
import tiktoken from 'tiktoken';
import Canvas from 'canvas';

let dirname = path.dirname(fileURLToPath(import.meta.url))

const chatsPath = path.join(dirname, 'chats');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEYt });
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const app = express();
const port = 3200;

// Middleware to parse JSON bodies
app.use(bodyParser.json({limit: '500mb'}));

const publicPath = path.join(dirname, 'public')

app.use(express.static(publicPath));

async function getAllChats(){
    let files = await fs.readdir(chatsPath)
    let chats = []
    for (let file of files){
        let chat = JSON.parse(await fs.readFile(path.join(chatsPath, file), 'utf8'))
        chats.push(chat)
    }
    // sort chats by createdAt
    chats.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt)
    })
    return chats
}


async function createNewChat(name){
    let data = JSON.parse(await fs.readFile(path.join(dirname, "settings.json"), 'utf8'))
    
    delete Object.assign(data, {["chatSettings"]: data["defaultChatSettings"] })["defaultChatSettings"];
    data.createdAt = new Date().toISOString()
    data.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    data.messages = `[{"root":"1","currentNode":"2","nodeIds":"3"},{"message":null,"id":"4","parent":null,"children":"5","previouslySelectedChild":"2","isRoot":true,"tokens":0},{"message":"6","id":"7","parent":"1","children":"8","previouslySelectedChild":null,"tokens":12},{"1714729139792bee7975b68117":"2"},"root",["2"],{"role":"9","content":"10"},"1714729139792bee7975b68117",[],"system","${data.chatSettings.systemPrompt}"]`
    delete data.chatSettings.systemPrompt;
    
    if (name){
        data.name = name
    }
    else{
        const regex = /New Chat(\s\d+)?/;
        const chatNumbers = allChats.map(chat => {
            const match = chat.name.match(regex);
            return match ? parseInt(match[1] ? match[1] : 1) : null;
        }).filter(chatNumber => chatNumber !== null);
        const maxChatNumber = chatNumbers.length > 0 ? Math.max(...chatNumbers) : 0;
        const newChatNumber = maxChatNumber + 1;
        data.name = newChatNumber === 1 ? "New Chat" : `New Chat ${newChatNumber}`;
    }
    
    writeToFile(path.join(chatsPath, data.id + ".json"), JSON.stringify(data, null, 4))
    
    allChats.push(data)
    allChats.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt)
    })
    return data
}

//createNewChat("Test Chat 2")

// wait 1 second
await new Promise(resolve => setTimeout(resolve, 1000))

const allChats = await getAllChats()

function writeToFile(filePath, jsonData){
    const currentTimeWithMilliseconds = new Date().toISOString()
    console.log(`current time with milliseconds: ${currentTimeWithMilliseconds}`);
    console.log("writing to", filePath)
    console.log("Writing JSON DATA:", jsonData)
    fs.writeFile(filePath, jsonData, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        }
    });
}

app.get('/videos', (req, res) => {
    res.sendFile(path.join(publicPath, 'videos.html'));
})

app.get('/feedback', (req, res) => {
    res.sendFile(path.join(publicPath, 'feedback.html'));
})

function calculateImageTokenCost(width, height, detail) {
    const lowDetailCost = 85;
    const highDetailCostPerTile = 170;
    const additionalHighDetailCost = 85;

    if (detail === 'low') {
        return lowDetailCost;
    } else if (detail === 'high') {
        // Step 1: Scale the image to fit within a 2048 x 2048 square
        let scale = Math.min(2048 / width, 2048 / height);
        let scaledWidth = width * scale;
        let scaledHeight = height * scale;

        // Step 2: Scale such that the shortest side is 768px
        scale = 768 / Math.min(scaledWidth, scaledHeight);
        scaledWidth = scaledWidth * scale;
        scaledHeight = scaledHeight * scale;

        // Step 3: Calculate the number of 512px squares needed
        const numTilesWidth = Math.ceil(scaledWidth / 512);
        const numTilesHeight = Math.ceil(scaledHeight / 512);
        const totalTiles = numTilesWidth * numTilesHeight;

        // Step 4: Calculate the total cost
        const totalCost = highDetailCostPerTile * totalTiles + additionalHighDetailCost;
        return totalCost;
    } else {
        throw new Error('Invalid detail level. Please choose "low" or "high".');
    }
}

function getImageDimensions(base64) {
    const img = new Canvas.Image();
    img.src = base64;
    return { width: img.width, height: img.height };
}

function numTokensFromMessage(message, model = "gpt-3.5-turbo-0301") {
    let encoding;
    try {
        encoding = tiktoken.encoding_for_model(model);
    } catch (error) {
        encoding = tiktoken.get_encoding("cl100k_base");
    }

    if (model === "gpt-3.5-turbo-0301") { // should be accurate enough for most things
        let numTokens = 0;
        //messages.forEach(message => {
        numTokens += 4; // every message follows <im_start>{role/name}\n{content}<im_end>\n
        for (const [key, value] of Object.entries(message)) {
            if (typeof value !== 'string') {
                numTokens += encoding.encode(value[0].text).length;
                value.slice(1).forEach(item => {
                    console.log("AA", item)
                    let base64 = item.image_url.url;
                    // get the image dimensions from the base64 string
                    let { width, height } = getImageDimensions(base64);
                    console.log(width, height, numTokens)
                    numTokens += calculateImageTokenCost(width, height, "high");
                    console.log(numTokens)
                });
            } else {
                numTokens += encoding.encode(value).length;
            }
            if (key === "name") { // if there's a name, the role is omitted
                numTokens -= 1; // role is always required and always 1 token
            }
        }
        //});
        numTokens += 2; // every reply is primed with <im_start>assistant
        return numTokens;
    } else {
        throw new Error(`numTokensFromMessage() is not presently implemented for model ${model}.`);
    }
}

app.post('/gettokencost', async (req, res) => {
    try {
        const message = JSON.parse(req.body.message);
        const model = req.body.model;
        if (message === null || message === undefined || typeof model !== 'string') {
            throw new Error('Invalid input');
        }
        console.log(message)
        return res.json({ count: numTokensFromMessage(message) });
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: error.message });
    }
})

app.post("/feedbacksubmit", async (req, res) => {
    const datetime = new Date().toISOString();
    const filename = `feedback\\${datetime.replace(/:/g, '-')}.json`;
    const filepath = path.join(dirname, filename);
    writeToFile(filepath, JSON.stringify(req.body, null, 4));
    res.json()
})

app.post("/search", async (req, res) => {
    const query = req.body.query;
    let matches = [];
    for (let i = 0; i < allChats.length; i++) {
        Object.values(parse(allChats[i].messages).nodeIds).forEach(node => {
            if (node.message.content.toLowerCase().includes(query.toLowerCase())) {
                matches.push(allChats[i].id);
            }
        })
        if (query === "" || allChats[i].name.toLowerCase().includes(query.toLowerCase())) {
            matches.push(allChats[i].id);
        }
    }
    matches = [...new Set(matches)];
    res.json({ matches });
})

app.post('/deletechat', async (req, res) => {
    const chatId = req.body.id;
    let foundChat = null;
    for (let i = 0; i < allChats.length; i++) {
        if (allChats[i].id == chatId) {
            foundChat = allChats[i];
            break;
        }
    }
    if (foundChat) {
        fs.unlink(path.join(chatsPath, chatId + ".json"), (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            }
        });
        allChats.splice(allChats.indexOf(foundChat), 1);
        res.json({ success: true });
    } else {
        res.json({ error: "Chat not found" });
    }
})

app.post('/renamechat', async (req, res) => {
    const chatId = req.body.id;
    const newName = req.body.newname;
    let foundChat = null;
    for (let i = 0; i < allChats.length; i++) {
        if (allChats[i].id == chatId) {
            foundChat = allChats[i];
            break;
        }
    }
    if (foundChat) {
        foundChat.name = newName;
        writeToFile(path.join(chatsPath, chatId + ".json"), JSON.stringify(foundChat, null, 4));
        res.json({ success: true });
    } else {
        res.json({ error: "Chat not found" });
    }
})

app.post('/getchatlist', async (req, res) => {
    const data = {
        chats: allChats.map(chat => {
            return { id: chat.id, name: chat.name };
        })
    };
    data.topChat = allChats[0]
    data.defaultSettings = JSON.parse(await fs.readFile(path.join(dirname, "settings.json"), 'utf8')).defaultChatSettings
    res.json(data);
})

app.post('/savedefaultsettings', async (req, res) => {
    const settings = req.body.settings;
    let oldSettings = JSON.parse(await fs.readFile(path.join(dirname, "settings.json"), 'utf8'))
    oldSettings.defaultChatSettings = settings
    writeToFile(path.join(dirname, "settings.json"), JSON.stringify(oldSettings, null, 4));
    res.json({ success: true });
})

app.post('/savechat', async (req, res) => {
    const messages = req.body.messages;
    const settings = JSON.parse(req.body.settings);
    const chatId = req.body.id;

    let foundChat = null;
    for (let i = 0; i < allChats.length; i++) {
        if (allChats[i].id == chatId) {
            foundChat = allChats[i];
            break;
        }
    }
    
    if (foundChat) {
        let parsedMessages = parse(messages)

        for (const value of Object.values(parsedMessages.nodeIds)) {
            if (value.tokens === NaN || value.tokens === undefined || value.tokens === null){
                value.tokens = numTokensFromMessage(value.message)
                console.log("set tokens to", value.tokens, " for ", value.message)
            }
        }

        foundChat.messages = stringify(parsedMessages)
        foundChat.chatSettings = settings
        writeToFile(path.join(chatsPath, chatId + ".json"), JSON.stringify(foundChat, null, 4));
        res.json({ success: true });
    } else {
        res.json({ error: "Chat not found" });
    }
})

app.post('/savesettings', async (req, res) => {
    const settings = JSON.parse(req.body.settings);
    const chatId = req.body.id;

    let foundChat = null;
    for (let i = 0; i < allChats.length; i++) {
        if (allChats[i].id == chatId) {
            foundChat = allChats[i];
            break;
        }
    }
    
    if (foundChat) {
        foundChat.chatSettings = settings
        writeToFile(path.join(chatsPath, chatId + ".json"), JSON.stringify(foundChat, null, 4));
        res.json({ success: true });
    } else {
        res.json({ error: "Chat not found" });
    }
})

app.post('/loadchat', async (req, res) => {
    let chatId = req.body.id
    let foundChat = null;
    for (let i = 0; i < allChats.length; i++) {
        if (allChats[i].id == chatId) {
            foundChat = allChats[i];
            break;
        }
    }

    if (foundChat) {
        res.json(foundChat);
    } else {
        res.json({ error: "Chat not found" });
    }
})

app.post('/newchat', async (req, res) => {
    const data = await createNewChat()
    res.json({data})
})

app.post('/submit', async (req, res) => {
    console.log('Received:', req.body);
    const chatId = req.body.chatId;
    const settings = req.body.settings;
    let messagesTree = req.body.messagesTree;
    let messages = req.body.messages
    if (messages.length > 0 && messages[0].role === "system" && messages[0].content === ""){
        console.log("did stuff")
        messages.shift()
    }
    console.log(messages)
    try {
        const startTime = new Date().getTime();
        
        let completion;
        if (settings.model.toLowerCase().includes('claude')) {
            completion = await anthropic.messages.stream({
                messages: messages,
                model: settings.model,
                max_tokens: settings.maxTokens,
                temperature: settings.temperature,
                top_p: settings.topP,
            });
        } else {
            completion = await openai.chat.completions.create({
                messages: messages,
                model: settings.model,
                max_tokens: settings.maxTokens,
                temperature: settings.temperature,
                top_p: settings.topP,
                frequency_penalty: settings.frequencyPenalty,
                presence_penalty: settings.prescencePenalty,
                stream: true,
            });
        }
        
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        
        let currentChatIndex = null;
        allChats.forEach((chat, index) => {
            if (chat.id == chatId) {
                currentChatIndex = index;
            }
        });
        if (currentChatIndex == null) {
            res.status(404).json({ error: 'Chat not found' });
            return;
        }

        const fileDataBeforeParse = await fs.readFile(path.join(chatsPath, chatId + ".json"), 'utf8')
        const currentTimeWithMilliseconds = new Date().toISOString()
        console.log(`current time with milliseconds: ${currentTimeWithMilliseconds}`);
        console.log("fileDataBeforeParse", fileDataBeforeParse)
        const fileData = JSON.parse(fileDataBeforeParse);
        fileData.messages = messagesTree;
        fileData.chatSettings = settings;
        allChats[currentChatIndex].messages = fileData.messages;

        writeToFile(path.join(chatsPath, chatId + ".json"), JSON.stringify(fileData, null, 4));
        messagesTree = parse(messagesTree);

        messagesTree.currentNode.parent.tokens = numTokensFromMessage(messagesTree.currentNode.parent.message);
    
        console.log("generating...")
        let i = 0
        for await (const chunk of completion) {
            if (settings.model.toLowerCase().includes('claude')) {
                if (chunk.type === 'content_block_delta') {
                    messagesTree.currentNode.message.content += chunk.delta.text;
                    if (i % 4 == 0){
                        fileData.messages = stringify(messagesTree);
                        allChats[currentChatIndex].messages = fileData.messages;
                        writeToFile(path.join(chatsPath, chatId + ".json"), JSON.stringify(fileData, null, 4));
                    }
                    res.write(JSON.stringify({"chunk": chunk.delta.text}) + "<|endoftext|>");
                    i += 1
                }
            } else {
                if (chunk.choices[0].delta.content) {
                    messagesTree.currentNode.message.content += chunk.choices[0].delta.content;
                    if (i % 4 == 0){
                        fileData.messages = stringify(messagesTree);
                        allChats[currentChatIndex].messages = fileData.messages;
                        writeToFile(path.join(chatsPath, chatId + ".json"), JSON.stringify(fileData, null, 4));
                    }
                    
                res.write(JSON.stringify({"chunk": chunk.choices[0].delta.content}) + "<|endoftext|>");
                i += 1
                }
            }
        }

        let tokens = numTokensFromMessage(messagesTree.currentNode.message);
        messagesTree.currentNode.tokens = tokens;
        res.write(JSON.stringify({"totalTokens": tokens}) + "<|endoftext|>")

        setTimeout(function() {
            fileData.messages = stringify(messagesTree);
            allChats[currentChatIndex].messages = fileData.messages;
            writeToFile(path.join(chatsPath, chatId + ".json"), JSON.stringify(fileData, null, 4));
            console.log("finished writing")
        }, 200);

        console.log("finished in ", new Date().getTime() - startTime, "ms")
        console.log("Tokens per second: ", tokens / ((new Date().getTime() - startTime) / 1000))

        res.end();

    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(400).json({ error: error.error.message });
        }
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
