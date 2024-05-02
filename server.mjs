import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from "openai";
import { promises as fs } from 'fs';
import { type } from 'os';
import { parse, stringify } from 'flatted';
import { all } from 'axios';

let dirname = path.dirname(fileURLToPath(import.meta.url))

const chatsPath = path.join(dirname, 'chats');

const openai = new OpenAI();

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

app.use(express.static(path.join(dirname, 'public')));

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
    
    data.messages = `[{"root":"1","currentNode":"2","nodeIds":"3"},{"message":null,"id":"4","parent":null,"children":"5","previouslySelectedChild":"2","isRoot":true},{"message":"6","id":"7","parent":"1","children":"8","previouslySelectedChild":null},{"1714480505986f331d8a3b7dce":"2"},"root",["2"],{"role":"9","content":"10"},"1714480505986f331d8a3b7dce",[],"system","${data.chatSettings.systemPrompt}"]`
    
    //data.chatSettings.systemPrompt ? [{"role": "system", "content": data.chatSettings.systemPrompt}] : []
    
    if (name){
        data.name = name
    }
    else{
        const regex = /New Chat(\s\d+)?/;
        const chatNumbers = allChats.map(chat => {
            const match = chat.name.match(regex);
            return match ? parseInt(match[1] ? match[1] : 1) : null;
        }).filter(chatNumber => chatNumber !== null);
        console.log(chatNumbers)
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

console.log(allChats)

function writeToFile(filePath, jsonData){
    fs.writeFile(filePath, jsonData, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        }
    });
}

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
    res.json(data);
})

app.post('/savechat', async (req, res) => {
    const messages = req.body.messages;
    const chatId = req.body.id;

    let foundChat = null;
    for (let i = 0; i < allChats.length; i++) {
        if (allChats[i].id == chatId) {
            foundChat = allChats[i];
            break;
        }
    }
    console.log(foundChat)
    console.log(messages)
    if (foundChat) {
        foundChat.messages = messages
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
        if (typeof foundChat.messages === 'string') {
            let obj = parse(foundChat.messages);
            console.log(obj)
            console.log(obj.currentNode)
        }
        res.json(foundChat);
    } else {
        res.json({ error: "Chat not found" });
    }
})

app.post('/newchat', async (req, res) => {
    const data = await createNewChat()
    console.log(data)
    res.json({data})
})

app.post('/submit', async (req, res) => {
    console.log('Received:', req.body);
    const chatId = req.body.chatId;
    let messagesTree = req.body.messagesTree;

    try {
        const completion = await openai.chat.completions.create({
            messages: req.body.messages,
            model: req.body.model,
            max_tokens: req.body.maxTokens,
            temperature: req.body.temperature,
            top_p: req.body.topP,
            frequency_penalty: req.body.frequencyPenalty,
            presence_penalty: req.body.prescencePenalty,
            stream: true,
        });
        
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

        const fileData = JSON.parse(await fs.readFile(path.join(chatsPath, chatId + ".json"), 'utf8'));
        fileData.messages = messagesTree;
        allChats[currentChatIndex].messages = fileData.messages;

        writeToFile(path.join(chatsPath, chatId + ".json"), JSON.stringify(fileData, null, 4));
        messagesTree = parse(messagesTree);


        let i = 0
        for await (const chunk of completion) {
            if (chunk.choices[0].delta.content) {
                messagesTree.currentNode.message.content += chunk.choices[0].delta.content;
                if (i % 5 == 0){
                    fileData.messages = stringify(messagesTree);
                    allChats[currentChatIndex].messages = fileData.messages;
                    writeToFile(path.join(chatsPath, chatId + ".json"), JSON.stringify(fileData, null, 4));
                }
                res.write(chunk.choices[0].delta.content);
                i += 1
            }
        }
        setTimeout(function() {
            fileData.messages = stringify(messagesTree);
            allChats[currentChatIndex].messages = fileData.messages;
            writeToFile(path.join(chatsPath, chatId + ".json"), JSON.stringify(fileData, null, 4));
        }, 200);

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
