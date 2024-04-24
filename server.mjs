import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from "openai";
import { promises as fs } from 'fs';

let dirname = path.dirname(fileURLToPath(import.meta.url))

const chatsPath = path.join(dirname, 'chats');

const openai = new OpenAI();

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

app.use(express.static(path.join(dirname, 'public')));

async function createNewChatJSON(){
    let data = JSON.parse(await fs.readFile(path.join(dirname, "settings.json"), 'utf8'))
    return JSON.stringify(Object.assign({}, data.defaultModelSettings, {
        messages: (data.defaultSystemPrompt ? [{"role": "system", "content": data.defaultSystemPrompt}] : [])
    }), null, 2)
}

function writeToFile(filePath, jsonData){
    fs.writeFile(filePath, jsonData, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        }
    });
}

app.post('/loadchat', async (req, res) => {
    let chatname = res.chatname
    chatData = await fs.readFile(path.join(dirname, chatname), 'utf8')
    res.json(chatData)
})

app.post('/newchat', async (req, res) => {
    let chatname = res.chatname
    let data
    if (chatname == undefined){
        data = await fs.readFile(path.join(dirname, "info.json"), 'utf8')
        chatname = `New Chat ${JSON.parse(data).nextchatnumber}`
        data = JSON.parse(data)
        data.nextchatnumber +=1
        data = JSON.stringify(data, null, 2)
    }

    writeToFile(path.join(chatsPath, chatname + ".json"), await createNewChatJSON())
    if (data){
        writeToFile(path.join(dirname, "info.json"), data)
    }
    res.json({chatname: chatname})
})

// Handle POST request to '/submit'
app.post('/submit', async (req, res) => {
    console.log('Received:', req.body);
    const chat = req.body.chat;

    try {
        const completion = await openai.chat.completions.create({
            model: req.body.model,
            messages: req.body.messages,
            temperature: req.body.temperature,
            max_tokens: req.body.maxTokens,
            stream: true,
        });
    
        
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        
        let data;
        try {
            const fileData = await fs.readFile(path.join(chatsPath, chat + ".json"), 'utf8');
            data = JSON.parse(fileData);
        } catch (err) {
            //console.error('Error reading or parsing JSON file:', err);
            // Handle the error appropriately, maybe initialize `data` with a default structure
            data = { messages: [] };
        }

        data.messages.push({"role": "user", "content": req.body.messages[req.body.messages.length-1].content});
        data.messages.push({"role": "assistant", "content": ""});
        writeToFile(path.join(chatsPath, chat + ".json"), JSON.stringify(data, null, 2));

        let i = 0
        for await (const chunk of completion) {
            if (chunk.choices[0].delta.content) {
                data.messages[data.messages.length-1].content += chunk.choices[0].delta.content;
                if (i % 5 == 0){
                    writeToFile(path.join(chatsPath, chat + ".json"), JSON.stringify(data, null, 2));
                }
                res.write(chunk.choices[0].delta.content);
                i += 1
            }
        }
        setTimeout(function() { writeToFile(path.join(chatsPath, chat + ".json"), JSON.stringify(data, null, 2)); }, 100);

        res.end();

    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error processing your request' });
        }
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
