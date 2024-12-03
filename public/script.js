document.getElementsByClassName("inputArea")[0].addEventListener("mousedown", function(event){
    document.getElementById("input").focus();
});

function handleEnterSubmit(event) {
    if (!isGenerating){
        if (event.which === 13 && !event.shiftKey) {
            event.preventDefault();
            let prompt = event.target.value
            event.target.value = ""
            add_chat_message(prompt, "user", promptImages);

            let newNode = messagesTree.addMessage({"role": "user", "content": prompt}, promptImages)
            
            promptImages = []
            promptinput.parentElement.querySelectorAll(".imageContainer").forEach(img => {
                img.remove()
            })

            getTokenCost(newNode).then(tokenCost => {
                newNode.tokens = tokenCost
            }).catch(error => {
                alert("btw newNode.tokens is now NaN. Failed to get token cost:", error);
                console.log("error from hehere")
            });

            runApiCall(messages, add_chat_message("", "assistant"))
        }
    }
}

let md = window.markdownit({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code language="' + lang + '">' +
                       hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                       '</code></pre>';
            } catch (__) {}
        }

        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
});

function copyCode(button){
    navigator.clipboard.writeText(button.parentElement.parentElement.nextElementSibling.innerText)
    setTimeout(() => {
        button.querySelector("p").innerText = "Copy code"
        button.querySelector(".copyButtonIcon").style.display = "block"
        button.querySelector(".copyButtonOk").style.display = "none"
    }, 2000);
    button.querySelector("p").innerText = "Copied!"
    button.querySelector(".copyButtonIcon").style.display = "none"
    button.querySelector(".copyButtonOk").style.display = "block"
}

function messageToHTML(content) {
    const lines = content.split('\n');
    let inCodeBlock = false;
    let unclosedBlockIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('```')) {
            if (inCodeBlock) {
                inCodeBlock = false;
                unclosedBlockIndex = -1;
            } else {
                inCodeBlock = true;
                unclosedBlockIndex = i;
            }
        }
    }
    
    const unclosedCodeBlockString = "mpw3iiulu392pjeqbte7gwtozvo7xddznv"
    if (inCodeBlock && unclosedBlockIndex !== -1) {
        lines[unclosedBlockIndex] = unclosedCodeBlockString + "\n" + lines[unclosedBlockIndex];
    }
    
    content = lines.join('\n');

    let temp = document.createElement("div");
    temp.innerHTML = md.render(content);

    temp.querySelectorAll("code").forEach(code => {
        if (code.parentElement.classList.contains("hljs")) {
            let newElem = document.createElement("div");
            let language = code.getAttribute("language") ?? "";
            let isUnclosed = code.parentElement.previousElementSibling && code.parentElement.previousElementSibling.innerText === unclosedCodeBlockString;
            if (isUnclosed) {
                code.parentElement.previousElementSibling.remove();
            }
            newElem.innerHTML = `
            <div class="codeCopyBlock">
                <p>${language}</p>
                <button class="copyButton" onmousedown="copyCode(this)" ontouchstart="copyCode(this)">
                    ${isUnclosed ? '<svg class="unfinishedCodeBlockIcon" fill="currentColor" height="24px" width="24px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128.00 128.00" xml:space="preserve" transform="rotate(0)matrix(1, 0, 0, 1, 0, 0)" stroke="#000000" stroke-width="0.00128"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <circle cx="39.2" cy="17.9" r="12.6"></circle> <path d="M78.6,70.2l-21.2,0l-5.7-28.4c-3.4-14.8-24.2-10.4-22,4.1l6.6,33c1,5,5,9.3,11.3,9.3h27.1c0,0,0,21.2,0,30 c0,9.5,13.3,9.5,13.3,0.2V79.7C88,75.1,84.8,70.2,78.6,70.2z"></path> <path d="M64.7,90.6H46.9c-6.4,0-11.8-3.8-13.4-11l-5.8-28.2c-1.4-6.9-11.1-4.6-9.8,2.1L24,82.9c2.5,11,11.9,18.1,21.4,18.1h19.5 C71.7,101,71.7,90.6,64.7,90.6z"></path> <path d="M91.1,3.9c-11.2,0-20.3,9.1-20.3,20.3c0,11.2,9.1,20.3,20.3,20.3c11.2,0,20.3-9.1,20.3-20.3C111.4,13.1,102.3,3.9,91.1,3.9 z M91.1,40.7c-9.1,0-16.5-7.4-16.5-16.5c0-9.1,7.4-16.5,16.5-16.5c9.1,0,16.5,7.4,16.5,16.5C107.5,33.3,100.1,40.7,91.1,40.7z"></path> <path d="M99.5,20l-8,3.6v-9.4c0-1.5-2.2-1.4-2.2,0l0,11.3c0,0.8,0.9,1.5,1.7,1l9.4-4.5C101.7,21.3,100.9,19.3,99.5,20z"></path> </g> </g></svg>' : ''}
                    <svg class="copyButtonIcon" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                    <svg class="copyButtonOk" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <p>Copy code</p>
                </button>
            </div>`;
            code.parentElement.parentElement.insertBefore(newElem, code.parentElement);
            code.parentElement.classList.add("codeBlock");
            if (isUnclosed) {
                code.parentElement.classList.add("unclosed-block");
            }
        }
    });
    
    return temp.innerHTML;
}


function utilityBack(button){
    let obj = button.parentElement.parentElement.parentElement
    let node = messagesTree.getNodeFromIndex(obj.messageIndex)
    let childIndex = node.parent.children.indexOf(node.parent.previouslySelectedChild)
    if (childIndex > 0){
        node.parent.previouslySelectedChild = node.parent.children[childIndex - 1]
        
        let nextSibling = obj
        while (nextSibling && nextSibling.classList.contains("messageContainer")){
            nextSibling = nextSibling.nextElementSibling
            nextSibling.previousElementSibling.remove()
        }
        
        node = node.parent.children[childIndex - 1]
        let index = childIndex
        while (node.children.length > 0){
            add_chat_message(node.message.content, node.message.role, node.images)
            node = node.previouslySelectedChild
            index += 1
        }
        add_chat_message(node.message.content, node.message.role, node.images)
        messagesTree.currentNode = node

        messagesTree.updateTreant()
        messages = messagesTree.getMessagesList()
        updateTreeControl()
        updateTokenCosts()
    }
}

function utilityForward(button){
    let obj = button.parentElement.parentElement.parentElement
    let node = messagesTree.getNodeFromIndex(obj.messageIndex)
    let childIndex = node.parent.children.indexOf(node.parent.previouslySelectedChild)
    if (childIndex < node.parent.children.length - 1){
        node.parent.previouslySelectedChild = node.parent.children[childIndex + 1]
        
        let nextSibling = obj
        while (nextSibling && nextSibling.classList.contains("messageContainer")){
            nextSibling = nextSibling.nextElementSibling
            nextSibling.previousElementSibling.remove()
        }
        
        node = node.parent.children[childIndex + 1]
        let index = childIndex + 1
        while (node.children.length > 0){
            add_chat_message(node.message.content, node.message.role, node.images)
            node = node.previouslySelectedChild
        }
        add_chat_message(node.message.content, node.message.role, node.images)
        messagesTree.currentNode = node

        messagesTree.updateTreant()
        messages = messagesTree.getMessagesList()
        updateTreeControl()
        updateTokenCosts()
    }
}

function test(){
    document.querySelectorAll(".messageContainer").forEach(elem => {
        console.log(elem.querySelector(".message").innerText, elem.messageIndex)
    })
}

function utilityUp(button){
    let obj = button.parentElement.parentElement.parentElement

    if (obj.previousElementSibling && obj.previousElementSibling.classList.contains("messageContainer")){
        obj.parentElement.insertBefore(obj, obj.previousElementSibling)
        updateArrows(obj)

        let temp = messages[obj.messageIndex]
        messages[obj.messageIndex] = messages[obj.messageIndex-1]
        messages[obj.messageIndex-1] = temp

        //obj.messageIndex -= 1
        //obj.nextElementSibling.messageIndex += 1
    }
}

function utilityDown(button){
    let obj = button.parentElement.parentElement.parentElement

    if (obj.nextElementSibling && obj.nextElementSibling.classList.contains("messageContainer")){
        obj.parentElement.insertBefore(obj.nextElementSibling, obj)
        updateArrows(obj)

        let temp = messages[obj.messageIndex]
        messages[obj.messageIndex] = messages[obj.messageIndex+1]
        messages[obj.messageIndex+1] = temp

        //obj.messageIndex += 1
        //obj.previousElementSibling.messageIndex -= 1
    }
}

function utilityCopy(button){
    let obj = button.parentElement.parentElement.parentElement
    
    let text = messages[obj.messageIndex].content
    if (typeof text != "string"){
        text = text[0].text
    }
    navigator.clipboard.writeText(text)

    
    obj.querySelector(".yes").onclick = null
    obj.querySelector(".copy").style.display = "none"
    obj.querySelector(".yes").style.display = "block"

    obj.onmouseleave = function(){
        obj.querySelector(".copy").style.display = "block"
        obj.querySelector(".yes").style.display = "none"
        obj.onmouseleave = null
    }
}

function utilityCache(button){
    let obj = button.parentElement.parentElement.parentElement
    let node = messagesTree.getNodeFromIndex(obj.messageIndex)
    if (typeof node.message.content == "string"){
        node.message.content = [{"type": "text", "text": node.message.content, "cache_control": {"type": "ephemeral"}}]
        console.log(node.message.content)
        console.log("heaaaa")
    } else {
        node.message.content[0].cache_control = {"type": "ephemeral"}
        console.log("he")
    }
    obj.querySelector(".cache").style.display = "none"
    obj.querySelector(".cacheRemove").style.display = "block"
}

function utilityCacheRemove(button){
    let obj = button.parentElement.parentElement.parentElement
    let node = messagesTree.getNodeFromIndex(obj.messageIndex)
    if (typeof node.message.content != "string"){
        delete node.message.content[0].cache_control
    } else {
        alert("Tried to remove cache control from a string message")
    }
    obj.querySelector(".cache").style.display = "block"
    obj.querySelector(".cacheRemove").style.display = "none"
}

function utilityDelete(button){
    let obj = button.parentElement.parentElement.parentElement

    function notdelete(){
        obj.querySelector(".copy").style.display = "block"
        obj.querySelector(".edit").style.display = "block"
        obj.querySelector(".delete").style.display = "block"
        obj.querySelector(".yes").style.display = "none"
        obj.querySelector(".no").style.display = "none"
        obj.querySelector(".yes").onclick = null
        obj.querySelector(".no").onclick = null
        updateArrows(obj)
        obj.onmouseleave = null
    }

    function remove(){
        obj.querySelector(".message").contentEditable = false
        obj.querySelector(".editButtons").style.display = "none"
        obj.querySelector(".utilityButtonContainer").style.display = "flex"
        obj.querySelector(".message").innerHTML = messageToHTML(obj.querySelector(".message").innerText)

        messagesTree.branchOut(messagesTree.getNodeFromIndex(obj.messageIndex-1))
        messagesTree.hardDeleteToNode(messagesTree.getNodeFromIndex(obj.messageIndex-1))
        messagesTree.updateTreant()
        updateTokenCosts()
        updateTreeControl()
        messages.splice(obj.messageIndex + 1, messages.length - obj.messageIndex - 1)
        if (typeof messages[obj.messageIndex].content != "string"){
            messages[obj.messageIndex].content[0].text = obj.querySelector(".message").innerText
        }
        else{
            messages[obj.messageIndex].content = obj.querySelector(".message").innerText
        }

        let nextSibling = obj
        while (nextSibling && nextSibling.classList.contains("messageContainer")){
            nextSibling = nextSibling.nextElementSibling
            nextSibling.previousElementSibling.remove()
        }
    }

    obj.querySelector(".no").onclick = notdelete
    obj.querySelector(".yes").onclick = remove

    obj.querySelector(".no").style.display = "block"
    obj.querySelector(".yes").style.display = "block"

    obj.querySelector(".up").style.display = "none"
    obj.querySelector(".down").style.display = "none"
    obj.querySelector(".copy").style.display = "none"
    obj.querySelector(".edit").style.display = "none"
    obj.querySelector(".delete").style.display = "none"

    obj.onmouseleave = notdelete
}

function utilityEdit(button){
    let obj = button.parentElement.parentElement.parentElement

    obj.querySelector(".utilityButtonContainer").style.display = "none"
    obj.querySelector(".editButtons").style.display = "flex"
    
    let oldText = obj.querySelector(".message").innerHTML
    let imagesHTML = ""
    obj.querySelectorAll(".message .imageContainer").forEach(img => {
        imagesHTML += img.outerHTML
    })
    if (typeof messages[obj.messageIndex].content != "string"){
        obj.querySelector(".message").innerHTML = "<pre class='messagePreTag'>" + messages[obj.messageIndex].content[0].text + "</pre>" + imagesHTML
    }
    else{
        obj.querySelector(".message").innerHTML = "<pre class='messagePreTag'>" + messages[obj.messageIndex].content + "</pre>" + imagesHTML
    }
    
    obj.querySelector(".message").contentEditable = true

    function generate(){
        if (isGenerating){
            return
        }
        obj.querySelector(".message").onkeydown = null
        obj.querySelector(".message").contentEditable = false
        obj.querySelector(".editButtons").style.display = "none"
        obj.querySelector(".utilityButtonContainer").style.display = "flex"
        
        messagesTree.branchOut(messagesTree.getNodeFromIndex(obj.messageIndex))
        messagesTree.hardDeleteToNode(messagesTree.getNodeFromIndex(obj.messageIndex))
        messagesTree.updateTreant()
        updateTokenCosts()
        messages.splice(obj.messageIndex + 1, messages.length - obj.messageIndex - 1)
        if (typeof messages[obj.messageIndex].content != "string"){
            messages[obj.messageIndex].content[0].text = obj.querySelector(".message").innerText
        }
        else{
            messages[obj.messageIndex].content = obj.querySelector(".message").innerText
        }
        obj.querySelector(".message").innerHTML = messageToHTML(obj.querySelector(".message").innerText) + imagesHTML

        let newNode = messagesTree.getNodeFromIndex(obj.messageIndex)
        getTokenCost(newNode).then(tokenCost => {
            newNode.tokens = tokenCost
        }).catch(error => {
            alert("btw newNode.tokens is now NaN. Failed to get token cost:", error);
            console.log("error from hehere")
        });

        let nextSibling = obj.nextElementSibling
        while (nextSibling && nextSibling.classList.contains("messageContainer")){
            nextSibling = nextSibling.nextElementSibling
            nextSibling.previousElementSibling.remove()
        }
        runApiCall(messages, add_chat_message("", "assistant"))
    }

    function save(){
        obj.querySelector(".message").onkeydown = null
        obj.querySelector(".message").contentEditable = false;
        obj.querySelector(".editButtons").style.display = "none";
        obj.querySelector(".utilityButtonContainer").style.display = "flex";
        
        messagesTree.branchOut(messagesTree.getNodeFromIndex(obj.messageIndex), false);
        messages = messagesTree.getMessagesList();
        if (typeof messages[obj.messageIndex].content != "string"){
            console.log(obj.querySelector(".message").innerText)
            messages[obj.messageIndex].content[0].text = obj.querySelector(".message").innerText;
        }
        else{
            console.log(obj.querySelector(".message").innerText)
            messages[obj.messageIndex].content = obj.querySelector(".message").innerText;
        }
        obj.querySelector(".message").innerHTML = messageToHTML(obj.querySelector(".message").innerText) + imagesHTML;

        let newNode = messagesTree.getNodeFromIndex(obj.messageIndex);

        getTokenCost(newNode).then(tokenCost => {
            newNode.tokens = tokenCost;
        }).catch(error => {
            alert("btw newNode.tokens is now NaN. Failed to get token cost:", error);
            console.log("error from hehere");
        });
        
        messagesTree.updateTreant();
        updateTreeControl()
        updateTokenCosts();
        saveChat();
    }

    function cancel(){
        obj.querySelector(".message").onkeydown = null
        obj.querySelector(".message").contentEditable = false
        obj.querySelector(".editButtons").style.display = "none"
        obj.querySelector(".utilityButtonContainer").style.display = "flex"
        obj.querySelector(".message").innerHTML = oldText
    }

    obj.querySelector(".generateButton").onclick = generate
    obj.querySelector(".saveButton").onclick = save
    obj.querySelector(".cancelButton").onclick = cancel

    obj.querySelector(".message").addEventListener("keydown", function(event){
        if (event.key == "Enter" && !event.shiftKey){
            event.preventDefault();
            generate();
        }
    })
    
}

function updateArrows(obj, recursive=false){
    if (obj && obj.classList.contains("messageContainer")){
        if (obj.nextElementSibling && obj.nextElementSibling.classList.contains("messageContainer")){
            obj.querySelector(".down").style.display = "block";
            obj.showDownArrow = true
        } else {
            obj.querySelector(".down").style.display = "none";
            obj.showDownArrow = false
        }
        if (obj.previousElementSibling && obj.previousElementSibling.classList.contains("messageContainer")){
            obj.querySelector(".up").style.display = "block";
            obj.showUpArrow = true
        } else {
            obj.querySelector(".up").style.display = "none";
            obj.showUpArrow = true
        }
        if (!recursive){
            updateArrows(obj.nextElementSibling, true);
            updateArrows(obj.previousElementSibling, true);
        }
    }
}

function updateTreeControl(){
    if (disableBranchingStuff){
        return
    }
    let TC = messagesTree.getTreeControl()
    TC.forEach((element, index) => {
        chatContainer.children[index+1].querySelector(".treeNode").innerHTML = `${element[0]} / ${element[1]}`
        if (element[1] > 1){
            if (index == 0){
                chatContainer.children[index+1].style.display = "block"
            }
            chatContainer.children[index+1].querySelector(".treeControl").style.visibility = "visible"
        }
    });
}

function createNewImageElement(backgroundImage){
    let newElem = document.createElement("div")
    newElem.classList.add("imageContainer")

    newElem.style.backgroundImage = `url(${backgroundImage})`

    let deleteButton = document.createElement("button")
    deleteButton.classList.add("imageContainerDeleteButton")
    deleteButton.innerHTML = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
    deleteButton.onclick = function(){
        let indexToRemove = [...newElem.parentElement.querySelsaveChatectorAll(".imageContainer")].indexOf(newElem)
        if (newElem.parentElement.classList.contains("inputArea")){
            promptImages.splice(indexToRemove, 1)
        }
        else{
            let node = messagesTree.getNodeFromIndex(newElem.parentElement.parentElement.messageIndex)
            messagesTree.branchOut(node)
            node = messagesTree.getNodeFromIndex(newElem.parentElement.parentElement.messageIndex)

            node.images.splice(indexToRemove, 1)
            messages = messagesTree.getMessagesList()

            console.log("aa", node.images)
            console.log(node.id)
            getTokenCost(node).then(tokenCost => {
                console.log("NEW TOKEN COST:", tokenCost)
                node.tokens = tokenCost
                updateTokenCosts()
                saveChat()
            }).catch(error => {
                alert("btw newNode.tokens is now NaN. Failed to get token cost:", error);
                console.log("error from hehere")
            });

        }
        newElem.remove()
    }
    newElem.appendChild(deleteButton)
    return newElem
}

function add_chat_message(content, user, images){
    let index = 0
    let current = chatContainer.children[1]
    while (current && current.classList.contains("messageContainer")){
        index += 1
        current = current.nextElementSibling
    }
    let htmlObject = templates[user].cloneNode(true)
    htmlObject.querySelector(".message").innerHTML = messageToHTML(content)
    htmlObject.messageIndex = index
    htmlObject.querySelector(".userSelect").value = { "user": "User", "assistant": "Assistant", "system": "System" }[user]
    // make the user select change the role of the message
    htmlObject.querySelector(".userSelect").onchange = function(){
        let role = htmlObject.querySelector(".userSelect").value.toLowerCase()
        htmlObject.classList.remove("userMessage")
        htmlObject.classList.remove("assistantMessage")
        htmlObject.classList.remove("systemMessage")
        htmlObject.classList.add(role + "Message")
        let index = htmlObject.messageIndex
        messages[index].role = role
        messagesTree.updateTreant()
        updateTokenCosts()
        saveChat()
    }

    if (index === 0 && user === "system" && content === ""){
        htmlObject.style.display = "none"
    }

    if (images){
        images.forEach(image => {
            let img = createNewImageElement(image)
            htmlObject.querySelector(".message").appendChild(img)
        });
    }

    chatContainer.insertBefore(htmlObject, input.parentElement)
    updateArrows(htmlObject)

    //htmlObject.onmouseover = function(){
    //    htmlObject.querySelector(".utilityButtonContainer").style.display = "block"
    //}
    
    return htmlObject.querySelector(".message")
}

function stopListening(){
    if (isGenerating){
        isGenerating = false
        editButtonsBottom.querySelector(".generateButton").style.display = "block"
        editButtonsBottom.querySelector(".saveButton").innerText = "Save"
        editButtonsBottom.querySelector(".saveButton").classList.remove("stopGenerating")
        editButtonsBottom.querySelector(".saveButton").onclick = function(){save()}
        messagesTree.updateTreant()
        updateTokenCosts()
    }
}

function runApiCall(messages, element){
    isGenerating = true
    let msg_obj = messagesTree.addMessage({"role": "assistant", "content": ""})
    msg_obj.tokens = 4
    const data = {
        messages: messages,
        settings: settings,
        chatId: currentChatId,
        messagesTree: Flatted.stringify(messagesTree)
    };

    editButtonsBottom.querySelector(".generateButton").style.display = "none"
    editButtonsBottom.querySelector(".saveButton").innerText = "Stop generating"
    editButtonsBottom.querySelector(".saveButton").classList.add("stopGenerating")
    editButtonsBottom.querySelector(".saveButton").onclick = stopListening

    
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }).then(response => {
        const reader = response.body.getReader();
        let totalText = ""
        return new ReadableStream({
            start(controller) {
                function push() {
                    reader.read().then(({ done, value }) => {
                        if (done || !isGenerating) {
                            controller.close();
                            stopListening()
                            return;
                        }
                        controller.enqueue(value);
                        let newStuff = new TextDecoder("utf-8").decode(value, { stream: true })

                        if (newStuff.endsWith("<1|endoftext|1>")){
                            let splitted = newStuff.split("<1|endoftext|1>")
                            splitted.pop()
                            splitted.forEach(part => {
                                part = JSON.parse(part)
                                if ("chunk" in part){
                                    totalText += part["chunk"]
                                }
                                if ("error" in part){
                                    showError(part["error"])
                                    stopListening()
                                    return
                                }
                            });
                            newStuff = JSON.parse(splitted[splitted.length-1])
                            if (typeof messages[messages.length-1].content != "string"){
                                messages[messages.length-1].content[0].text = totalText
                            }
                            else{
                                messages[messages.length-1].content = totalText
                            }
                            if ("totalTokens" in newStuff){
                                msg_obj.tokens = newStuff["totalTokens"]
                            }
                            msg_obj.message.content = totalText
                            updateTokenCosts()
    
                            htmlContent = messageToHTML(totalText)
                            element.innerHTML = htmlContent
                        }
                        else{
                            let parsed = JSON.parse(newStuff)
                            if ("error" in parsed){
                                showError(parsed["error"])
                                stopListening()
                            }
                        }

                        push();
                    }).catch(error => {
                        console.log(error)
                        console.error('Error:', error);
                        controller.error(error);
                        stopListening()
                    });
                }
                push();
            }
        });
    }).catch(error => {
        console.error('Error:', error);
    });
};

function generateId(){
    return Date.now() + Math.random().toString(16).slice(2)
}

class MessageNode {
    constructor(message, id, isRoot, tokens) {
        this.message = message;
        this.id = id;
        this.parent = null;
        this.children = [];
        this.previouslySelectedChild = null;
        this.isRoot = isRoot;
        this.tokens = tokens;
        // update the string in server after adding new properties
    }
}

class MessageTree {
    constructor() {
        this.root = new MessageNode(null, "root", true);
        this.root.tokens = 0
        this.currentNode = this.root;
        this.nodeIds = {}
        // update the string in server after adding new properties
    }

    addMessage(message, images) {
        let id = generateId()
        
        const newNode = new MessageNode(message, id);
        newNode.tokens = NaN
        if (images && images.length > 0){
            newNode.images = images
            messages.push({role: message.role, content: [{"type": "text", "text": message.content}, ...images.map(image => {return {"type": "image_url", "image_url": {"url": image}}})]})
        }
        else{
            messages.push(message)
        }
        
        this.nodeIds[id] = newNode
        //if (!this.root) {
        //    this.root = newNode;
        //} else {
        newNode.parent = this.currentNode;
        this.currentNode.children.push(newNode);
        //}
        if (this.currentNode){
            this.currentNode.previouslySelectedChild = newNode
        } else{
        }
        this.currentNode = newNode;
        this.updateTreant()
        updateTreeControl()
        updateTokenCosts()
        return newNode
    }

    branchOut(node, update=true, deletedNodeId=null){
        if (disableBranchingStuff){
            return
        }
        this.currentNode.marked = true
        function recursivlyCopy(node, main, newParent){
            let id = generateId()
            let newNode = new MessageNode(JSON.parse(JSON.stringify(node.message)), id, false, node.tokens)
            if (node.images){
                newNode.images = JSON.parse(JSON.stringify(node.images))
            }
            main.nodeIds[id] = newNode
            newNode.parent = newParent ?? node.parent;
            let oldCurrentNode = main.currentNode
            if (node.marked){
                main.currentNode.marked = false
                main.currentNode = newNode
                if (deletedNodeId != node.id){
                    main.currentNode.parent.previouslySelectedChild = newNode
                    let temp = main.currentNode
                    while (temp != main.root){
                        temp.parent.previouslySelectedChild = temp
                        temp = temp.parent
                    }
                }
            }
            ;(newParent ?? node.parent).children.push(newNode)
        
            if (node != oldCurrentNode){
                node.children.forEach(child => {
                    recursivlyCopy(child, main, newNode)
                });
            }
            // probably works
            let newThing = newNode.children[node.children.indexOf(node.previouslySelectedChild)]
            if (newThing){
                newNode.previouslySelectedChild = newThing
            }
        }
        
        recursivlyCopy(node, this)
        if (update){
            this.updateTreant()
            updateTreeControl()
            updateTokenCosts()
            messages = this.getMessagesList()
        }
    }

    removeNode(node){
        node.parent.children = node.parent.children.filter(child => child != node)
        node.children.forEach(child => {
            child.parent = node.parent
        });
        node.parent.children = node.parent.children.concat(node.children)
        this.nodeIds[node.id] = null
        if (this.currentNode == node){
            this.currentNode = node.parent
        }
        messages = this.getMessagesList()
        this.updateTreant()
        updateTokenCosts()
    }

    hardDeleteToNode(node){
        function recursive(node2){
            node2.children.forEach(child => {
                recursive(child)
            });
            node2.children = []
            node2.parent = null
            if (node2 == messagesTree.currentNode){
                messagesTree.currentNode = node
            }
        }
        node.children.forEach(child => {
            recursive(child)
        });
        node.children = []
    }

    getNodeFromIndex(index){
        let node = this.currentNode
        // get the depth of the node
        let depth = 0
        while (node != this.root){
            node = node.parent
            depth += 1
        }
        index = depth - index - 1
        node = this.currentNode
        while (index > 0){
            node = node.parent
            index -= 1
        }
        return node
    }

    getMessagesList() {
        const messages = [];
        let node = this.currentNode
        while (node != this.root) {
            if (node.message){
                if (node.images){
                    messages.push({role: node.message.role, content: [{"type": "text", "text": node.message.content}, ...node.images.map(image => {return {"type": "image_url", "image_url": {"url": image}}})]})
                } else{
                    messages.push(node.message);
                }
            }
            node = node.parent;
        }
        return messages.reverse();
    }
    
    getMessagesTokens() {
        const messages = [];
        let node = this.currentNode
        while (node != this.root) {
            if (isNaN(node.tokens) || node.tokens === undefined){
                return null
            }
            messages.push(node.tokens);
            //console.log("Message:", node.message.content, "Tokens:", node.tokens, "ID:", node.id, "Images:", node.images)
            node = node.parent;
        }
        return messages.reverse();
    }

    getTreeControl(){
        let node = this.currentNode
        let control = []
        while (node != this.root) {
            control.push([node.parent.children.indexOf(node) + 1, node.parent.children.length]);
            node = node.parent;
        }
        return control.reverse()
    }

    updateTreant(){
        if (disableBranchingStuff){
            return
        }
        let config = {
            container: "#tree-simple"
        };
        
        let chart_config = [config]
        
        function recursive(node, parent){
            let new_treant
            let sign = ""
            if (node.parent && node.parent.previouslySelectedChild == node){
                sign = "🔴"
            }
            if (parent){
                new_treant = {parent: parent, text: {name: sign + node.message.content}}
            } else{
                new_treant = {text: {name: sign + (node.isRoot ? "root" : node.message.content)}}
            }
            chart_config.push(new_treant)
            node.children.forEach(child => {
                recursive(child, new_treant)
            });
        }
        recursive(this.root)
        
        if (treant){
            treant.destroy()
        }
        treant = new Treant(chart_config);
    }

    toString(){
        function replacer(key, value) {
            if (value === this) {
                return "[Circular]";
            }
            return value;
        }
          
        return JSON.stringify(this.root, replacer)
    }
}


function saveChat(){
    fetch('/savechat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({messages: Flatted.stringify(messagesTree), id: currentChatId, settings: JSON.stringify(settings)}),
    })
    .then(response => {
        if (!response.ok) {
            alert("Error saving chat")
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
}

function generateNewTemplateString(){
    let tempTree = new MessageTree()
    let newNode = tempTree.addMessage({"role": "system", "content": "This is the system message"})
    getTokenCost(newNode).then(tokenCost => {
        newNode.tokens = tokenCost
        let str = Flatted.stringify(tempTree)
        console.log(str)
    }).catch(error => {
        alert("btw newNode.tokens is now NaN. Failed to get token cost:", error);
        console.log("error from hehere")
    });
}

async function getTokenCost(node){
    let message = node.message
    if (node.images){
        message = {role: node.message.role, content: [{"type": "text", "text": node.message.content}, ...node.images.map(image => {return {"type": "image_url", "image_url": {"url": image}}})]}
    }
    return fetch('/gettokencost', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({message: JSON.stringify(message), model: settings["model"]}),
    })
    .then(response => {
        if (!response.ok) {
            alert("Error fetching token cost")
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(response => {
        if (response.error){
            alert(response.error)
            console.log(response)
        }
        else{
            return response.count
        }
    })
}

function updateTokenCosts(recursionNumber=0){
    let tokens = messagesTree.getMessagesTokens()
    if (tokens == undefined || tokens == null){
        if (recursionNumber > 20){
            alert("recursion limit when trying to get token costs.")
            return
        }
        setTimeout(() => {
            updateTokenCosts(recursionNumber+1)
        }, 100);
        return
    }
    let total = tokens.reduce((sum, token) => sum + token, 0);
    let costString = (modelsSettings[settings["model"]]["tokenCost"]["input"]*total).toFixed(7)
    document.querySelector(".totalTokens").innerText = `Tokens: ${total} ($${costString})`
    if (tokens.length > 0){
        let costString = (modelsSettings[settings["model"]]["tokenCost"]["output"]*tokens[tokens.length-1]).toFixed(7)
        document.querySelector(".outputTokens").innerText = `Last msg: ${tokens[tokens.length-1]} ($${costString})`
    } else{
        let costString = (0).toFixed(7)
        document.querySelector(".outputTokens").innerText = `Last msg: 0} ($${costString})`
    }
}

function saveSettings(){
    fetch('/savesettings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({id: currentChatId, settings: JSON.stringify(settings)}),
    })
    .then(response => {
        if (!response.ok) {
            alert("Error saving settings")
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
}

function chatNo(e, button){
    e.stopPropagation()
    unselectChatEditing()
}

function chatYes(e, button){
    e.stopPropagation()
    if (button.parentElement.parentElement.isBeingDeleted){
        fetch('/deletechat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({id: button.parentElement.parentElement.chatId})
        })
        .then(response => {
            if (!response.ok) {
                alert("Error deleting chat")
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error){
                alert(data.error)
            }
            else{
                document.querySelectorAll(".sideBarChatSelectThing").forEach(elem => {
                    if (elem.id != "chatTemplate"){
                        if (elem.chatId == button.parentElement.parentElement.chatId){
                            let parentElement = elem.parentElement
                            elem.remove()
                            if (elem.classList.contains("selected")){
                                if (parentElement.children.length > 1){
                                    selectChat(parentElement.children[1])
                                }
                                else{
                                    createNewChat()
                                }
                            }
                        }
                    }
                })
            }
        })
    }
    else if(button.parentElement.parentElement.isBeingEdited){
        finalizeChatEditName(button.parentElement.parentElement.querySelector(".chatName"))
    }
    else{
        alert("What the fuck just happened?")
    }
}

function deleteChat(e, button){
    e.stopPropagation()
    button.parentElement.querySelector(".chatsButtonEdit").style.display = "none"
    button.parentElement.querySelector(".chatsButtonDelete").style.display = "none"
    button.parentElement.querySelector(".chatsButtonYes").style.display = "flex"
    button.parentElement.querySelector(".chatsButtonNo").style.display = "flex"
    button.parentElement.parentElement.isBeingDeleted = true
}

function finalizeChatEditName(chatNameP){
    fetch('/renamechat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({id: chatNameP.parentElement.parentElement.chatId, newname: chatNameP.innerText})
    })
    .then(response => {
        if (!response.ok) {
            alert("Error deleting chat")
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.error){
            alert(data.error)
        }
        else{
            chatNameP.innerText = chatNameP.innerText.trim()
            chatNameP.parentElement.parentElement.editedOldName = chatNameP.innerText
        }
        unselectChatEditing()
    })
}

function editChatName(e, button){
    e.stopPropagation()
    button.parentElement.querySelector(".chatsButtonEdit").style.display = "none"
    button.parentElement.querySelector(".chatsButtonDelete").style.display = "none"
    button.parentElement.querySelector(".chatsButtonYes").style.display = "flex"
    button.parentElement.querySelector(".chatsButtonNo").style.display = "flex"
    button.parentElement.parentElement.isBeingEdited = true

    let chatNameP = button.parentElement.parentElement.querySelector(".chatName")
    button.parentElement.parentElement.editedOldName = chatNameP.innerText
    chatNameP.contentEditable = true
    chatNameP.focus()
}

let treant

let errorMessageContainer = document.getElementById("errorMessageContainer")

function closeError(){
    errorMessageContainer.style.display = "none"
}

function showError(message){
    errorMessageContainer.style.display = "flex"
    errorMessageContainer.querySelector(".errorMessage").innerText = message
}

function generate(){
    if (isGenerating){
        return
    }
    
    if (promptinput.value){
        save(true)
    }
    runApiCall(messages, add_chat_message("", "assistant"))
}

function save(dontFetch=false){
    if (promptinput.value || promptImages.length > 0){
        add_chat_message(promptinput.value, "user", promptImages);
        let newNode = messagesTree.addMessage({"role": "user", "content": promptinput.value}, promptImages)

        promptinput.value = ""
        promptImages = []
        promptinput.parentElement.querySelectorAll(".imageContainer").forEach(img => {
            img.remove()
        })

        getTokenCost(newNode).then(tokenCost => {
            newNode.tokens = tokenCost
        }).catch(error => {
            alert("btw newNode.tokens is now NaN. Failed to get token cost:", error);
            console.log("error from hehere")
        });
        if (!dontFetch){
            saveChat()
        }
        window.scrollTo(0, document.body.scrollHeight-500);
    }
}

function createNewChat(){
    fetch('/newchat', {
        method: 'POST', // or 'GET' if your server supports it
        headers: {
            'Content-Type': 'application/json',
            // Add other headers as required
        }
    })
    .then(response => {
        if (!response.ok) {
            alert('Network response was not ok');
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        data = data.data
        if (data.error){
            alert(data.error);
        }
        else{
            sidebarNewChat(data.name, data.id, true)
            loadChat(data)
            
            if (document.querySelectorAll(".sideBarChatSelectThing").length == 2){
                document.querySelectorAll(".sideBarChatSelectThing")[1].classList.add("selected")
            }
            document.querySelectorAll(".sideBarChatSelectThing").forEach(elem => {
                if (elem.id != "chatTemplate"){
                    let parentElement = elem.parentElement
                    if (elem.classList.contains("selected")){
                        elem.classList.remove("selected")
                        parentElement.children[1].classList.add("selected")
                    }
                }
            })
            stopListening()
        }
    })
    .catch(error => {
        console.error(error);
    });

}


function gotoVideos(){
    window.location.href = "/videos"
}

function gotoFeedback(){
    window.location.href = "/feedback"
}

let defaultSettings = {}

function openSettings(){
    let settingsMenu = document.querySelector(".settings")
    settingsMenu.style.display = settingsMenu.style.display == "none" || settingsMenu.style.display == "" ? "block" : "none"
    if (settingsMenu.style.display == "block"){
        settingsMenu.querySelector(".defaultSystemPrompt").value = defaultSettings["systemPrompt"]
        settingsMenu.querySelector(".modelSelect").value = defaultSettings["model"]
        settingsMenu.querySelector(".maxTokens").value = defaultSettings["maxTokens"]
        settingsMenu.querySelector(".temperature").value = defaultSettings["temperature"]
        settingsMenu.querySelector(".topP").value = defaultSettings["topP"]
        settingsMenu.querySelector(".presencePenalty").value = defaultSettings["prescencePenalty"]
        settingsMenu.querySelector(".frequencyPenalty").value = defaultSettings["frequencyPenalty"]
    }
}

function saveSettingsMenu(){
    let settingsMenu = document.querySelector(".settings")
    let defaultSystemPrompt = settingsMenu.querySelector(".defaultSystemPrompt").value
    let model = settingsMenu.querySelector(".modelSelect").value
    let maxTokens = parseInt(settingsMenu.querySelector(".maxTokens").value)
    let temperature = parseFloat(settingsMenu.querySelector(".temperature").value)
    let topP = parseFloat(settingsMenu.querySelector(".topP").value)
    let prescencePenalty = parseFloat(settingsMenu.querySelector(".presencePenalty").value)
    let frequencyPenalty = parseFloat(settingsMenu.querySelector(".frequencyPenalty").value)
    let settings = {
        systemPrompt: defaultSystemPrompt,
        model: model,
        maxTokens: maxTokens,
        temperature: temperature,
        topP: topP,
        prescencePenalty: prescencePenalty,
        frequencyPenalty: frequencyPenalty
    }
    defaultSettings = JSON.parse(JSON.stringify(settings))
    fetch('/savedefaultsettings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({settings: settings}),
    })
    .then(response => {
        if (!response.ok) {
            alert('Network response was not ok');
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.error){
            alert(data.error);
        }
        else{
            settingsMenu.style.display = "none"
        }
    })
}

function cancelSettingsMenu(){
    let settingsMenu = document.querySelector(".settings")
    settingsMenu.style.display = "none"
}



let editButtonsBottom = document.getElementsByClassName("editButtonsBottom")[0]
editButtonsBottom.querySelector(".generateButton").onclick = generate
editButtonsBottom.querySelector(".saveButton").onclick = function(){save()}

let settings = {
    "model": "gpt-3.5-turbo",
    "maxTokens": 400,
    "temperature": 0,
    "topP": 1,
    "prescencePenalty": 0,
    "frequencyPenalty": 0
}

let defaultLimits = {
    "maxTokens": 4096,
    "temperature": 2,
    "topP": 1,
    "prescencePenalty": 2,
    "frequencyPenalty": 2
}

let gpt4ominiLimits = JSON.parse(JSON.stringify(defaultLimits))
gpt4ominiLimits["maxTokens"] = 16384

let m1 = 1000000
let modelsSettings = {
    "claude-3-5-sonnet-20241022": {
        "limits": defaultLimits,
        "tokenCost": {"input": 3/m1, "output": 15/m1}
    },
    "gpt-4o": {
        "limits": defaultLimits,
        "tokenCost": {"input": 5/m1, "output": 15/m1}
    },
    "ft:gpt-4o-mini-2024-07-18:aivg-x:myreddit:9pfSQHgA": {
        "limits": gpt4ominiLimits,
        "tokenCost": {"input": 0.30/m1, "output": 1.2/m1}
    },
    "ft:gpt-4o-mini-2024-07-18:aivg-x:myredditmt:9phj3bla": {
        "limits": gpt4ominiLimits,
        "tokenCost": {"input": 0.30/m1, "output": 1.2/m1}
    },
    "ft:gpt-4o-mini-2024-07-18:aivg-x:myredditmtv3:9rYg2hxk": {
        "limits": gpt4ominiLimits,
        "tokenCost": {"input": 0.30/m1, "output": 1.2/m1}
    },
    "gpt-4o-mini": {
        "limits": gpt4ominiLimits,
        "tokenCost": {"input": 0.15/m1, "output": 0.6/m1}
    },
    "gpt-4-turbo": {
        "limits": defaultLimits,
        "tokenCost": {"input": 10/m1, "output": 30/m1}
    },
    "gpt-3.5-turbo": {
        "limits": defaultLimits,
        "tokenCost": {"input": 0.5/m1, "output": 1.5/m1}
    },
    "claude-3-5-sonnet-20240620": {
        "limits": defaultLimits,
        "tokenCost": {"input": 3/m1, "output": 15/m1}
    },
    "claude-3-opus-20240229": {
        "limits": defaultLimits,
        "tokenCost": {"input": 0.5/m1, "output": 1.5/m1}
    },
}
settings["model"] = "gpt-3.5-turbo" //Object.keys(modelsSettings)[0]

document.querySelectorAll(".modelSelect").forEach(modelSelect => {
    for (let key in modelsSettings){
        modelSelect.innerHTML += `<option value="${key}">${key}</option>`
    }
})

let buttonLine = document.getElementsByClassName("buttonLine")[0]
let settingsSelector = document.getElementsByClassName("settingsSelector")[0]
let settingsSlider = settingsSelector.querySelector(".slider")
let currentButton = null
let currentButtonName = null
let dontClose = false

function showTree(){
    document.getElementById("tree-simple").style.display = "block"
}

function hideTree(){
    document.getElementById("tree-simple").style.display = "none"
}

let disableBranchingStuff = false



// add event listener
settingsSlider.addEventListener("input", function(event){
    event.stopPropagation();
    if (currentButton){
        currentButton.querySelector(".btnNumber").innerText = this.value
        settings[currentButtonName] = parseFloat(this.value)
    }
})
settingsSelector.addEventListener("click", function(event){
    event.stopPropagation();
})

settingsSelector.style.display = "none"

function unselectButtonLine(){
    if (currentButton && currentButtonName != "model"){
        currentButton.querySelector(".btnNumber").contentEditable = false
        currentButton.querySelector(".btnNumber").innerText = settings[currentButtonName]
    }
    settingsSelector.style.display = "none"
    currentButton = null
    currentButtonName = null
    saveSettings()
}

function unselectChatEditing(){
    document.querySelectorAll(".sideBarChatSelectThing").forEach(elem => {
        elem.isBeingDeleted = false
        elem.isBeingEdited = false
        elem.querySelector(".chatsButtonEdit").style.display = "flex"
        elem.querySelector(".chatsButtonDelete").style.display = "flex"
        elem.querySelector(".chatsButtonYes").style.display = "none"
        elem.querySelector(".chatsButtonNo").style.display = "none"
        elem.querySelector(".chatName").contentEditable = false
        if (elem.editedOldName){
            elem.querySelector(".chatName").innerText = elem.editedOldName
        }
    })
}

function unselectStuff(param){
    if (settingsSelector.style.display != "none"){
        unselectButtonLine()
    }
    if (param.target.querySelector("chatsButtonDelete") === null && param.target.classList.contains("chatName") !== true){
        unselectChatEditing()
    }
}

document.addEventListener("click", unselectStuff)

buttonLine.querySelectorAll(".btnContainer").forEach(button => {
    let buttonName = button.classList[1]
    buttonName = {"btnModelSelect": "model", "btnMaxTokens": "maxTokens", "btnTemperature": "temperature", "btnTopP": "topP", "btnPrescencePenalty": "prescencePenalty", "btnFrequencyPenalty": "frequencyPenalty"}[buttonName]
    if (buttonName != "model"){
        button.querySelector(".btnNumber").innerText = settings[buttonName]
        button.querySelector(".btnNumber").addEventListener("keypress", function(event){
            // get position of the cursor
            if (buttonName == "maxTokens" && event.which === 46){
                event.preventDefault()
                return
            }
            if (event.which === 13){
                event.preventDefault()
                unselectButtonLine()
                return
            }
            let index = window.getSelection().getRangeAt(0).startOffset
            let newInnerTextValue = event.target.innerText.toString().substring(0, index) + String.fromCharCode(event.which) + event.target.innerText.toString().substring(index)
            if (event.which !== 46 && isNaN(String.fromCharCode(event.which))){event.preventDefault(); return}
            settingsSlider.value = newInnerTextValue
            settings[buttonName] = parseFloat(newInnerTextValue)
        })
    }
    else{
        button.querySelector(".modelSelect").addEventListener("change", function(event){
            settings["model"] = event.target.value
            updateTokenCosts()
        })
    }
    button.onclick = function(event){
        event.stopPropagation()
        if (button.isEqualNode(currentButton) && !event.target.classList.contains("btnNumber")){
            unselectButtonLine()
            return
        }
        if (currentButton != button){
            currentButton = button
            currentButtonName = buttonName
            if (button.classList.contains("btnModelSelect")){

            }
            else{
                button.querySelector(".btnNumber").contentEditable = true
                settingsSelector.style.display = "flex"
                settingsSlider.min = buttonName == "maxTokens" ? 1 : 0
                let limit = modelsSettings[settings["model"]]["limits"][buttonName]
                settingsSlider.max = limit
                settingsSlider.step = limit > 100 ? 1 : 0.1
                settingsSlider.value = settings[buttonName]

                var rect = button.getBoundingClientRect();
                settingsSelector.style.display = "block"
                settingsSelector.style.top = rect.bottom + "px"
                var centerX = rect.left + rect.width / 2 - 230; // 230 is the size of the sidebar
                settingsSelector.style.left = centerX - settingsSelector.offsetWidth / 2 - 10 + "px"
            }
            
        }
    }
});


let isGenerating = false
let chatContainer = document.getElementById("chatContainer")
let templateContainer = document.getElementById("templates")

let messages = []
let messagesTree = new MessageTree()

let currentChatId = null

let systemPrompt = `Loading...`

templateContainer.firstElementChild.querySelector(".yes").style.display = "none";
templateContainer.firstElementChild.querySelector(".no").style.display = "none";
templateContainer.firstElementChild.querySelector(".cacheRemove").style.display = "none";

let userTemplate = templateContainer.firstElementChild.cloneNode(true)
let assistantTemplate = templateContainer.firstElementChild.cloneNode(true)
let systemTemplate = templateContainer.firstElementChild.cloneNode(true)
assistantTemplate.classList.remove("userMessage")
assistantTemplate.classList.add("assistantMessage")
systemTemplate.classList.remove("userMessage")
systemTemplate.classList.add("systemMessage")

let templates = {
    "user": userTemplate.cloneNode(true),
    "assistant": assistantTemplate.cloneNode(true),
    "system": systemTemplate.cloneNode(true)
}

chatTemplate = document.getElementById("chatTemplate")
chatTemplate.style.display = "none"

function selectChat(elem){
    let selected = document.getElementsByClassName("selected")
    for (let i = 0; i < selected.length; i++){
        selected[i].classList.remove("selected")
    }
    elem.classList.add("selected")

    fetch('/loadchat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({id: elem.chatId})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.error){
            alert(data.error);
        }
        loadChat(data)
    })
    .catch(error => {
        console.error(error);
    });
}

function sidebarNewChat(name, id, atStart=false){
    chatTemplate.querySelector(".chatName").innerText = name
    let newElem = chatTemplate.cloneNode(true)
    newElem.id = ""
    newElem.style.display = "flex"
    newElem.chatId = id
    newElem.onclick = function(){selectChat(newElem)}
    newElem.querySelector(".chatName").addEventListener("keypress", function(event){
        if (newElem.querySelector(".chatName").contentEditable == "true" /*breh javascript why*/ && event.which === 13){
            event.preventDefault()
            newElem.querySelector(".chatName").blur()
            finalizeChatEditName(newElem.querySelector(".chatName"))
        }
    })
    if (atStart && chatTemplate.parentElement.children.length > 1){
        if (chatTemplate.parentElement.children[1]){
            chatTemplate.parentElement.insertBefore(newElem, chatTemplate.parentElement.children[1]);
        } else{
            chatTemplate.parentElement.appendChild(newElem);
        }
    } else {
        chatTemplate.parentElement.appendChild(newElem);
    }
    return newElem
}

function loadChat(chat, initial_load=false, useLastUsedChat=false){
    currentChatId = chat.id
    let newObj = Flatted.parse(chat.messages)
    if (initial_load && !useLastUsedChat){
        if (newObj.currentNode.children.length === 0 && newObj.currentNode.message.role === "system" && newObj.currentNode.message.content === "" && newObj.currentNode.parent == newObj.root){
            
        } else {
            createNewChat()
            return
        }
    }
    messagesTree.root = newObj.root
    messagesTree.currentNode = newObj.currentNode
    messagesTree.nodeIds = newObj.nodeIds

    messagesTree.updateTreant()

    let current = chatContainer.children[1]
    while (current && current.classList.contains("messageContainer")){
        current.remove()
        current = chatContainer.children[1]
    }

    messages = messagesTree.getMessagesList()
    messages.forEach((message, index) => {
        if (typeof message.content != "string"){
            add_chat_message(message.content[0].text, message.role, message.content.slice(1).map(image => image.image_url.url))
        }
        else{
            add_chat_message(message.content, message.role)
        }
    });
    updateTreeControl()
    updateTokenCosts()

    settings = chat.chatSettings
    
    buttonLine.querySelectorAll(".btnContainer").forEach(button => {
        let buttonName = button.classList[1]
        buttonName = {"btnModelSelect": "model", "btnMaxTokens": "maxTokens", "btnTemperature": "temperature", "btnTopP": "topP", "btnPrescencePenalty": "prescencePenalty", "btnFrequencyPenalty": "frequencyPenalty"}[buttonName]
        if (buttonName != "model"){
            button.querySelector(".btnNumber").innerText = settings[buttonName]
        }
        else{
            button.querySelector(".modelSelect").value = settings["model"]
        }
    });
}


fetch('/getchatlist', {
    method: 'POST', // or 'GET' if your server supports it
    headers: {
        'Content-Type': 'application/json',
        // Add other headers as required
    }
})
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
})
.then(data => {
    defaultSettings = data.defaultSettings
    if (data.lastUsed){
        loadChat(data.lastUsed, true, data.useLastUsedChat)
    }
    else{
        createNewChat()
    }

    data.chats.forEach(chat => {
        if (chat.id == data.lastUsed.id){
            let elem = sidebarNewChat(chat.name, chat.id)
            elem.classList.add("selected")
        } else{
            sidebarNewChat(chat.name, chat.id)
        }
    });
})

let searchInput = document.querySelector(".searchBar").querySelector("input")
searchInput.addEventListener("input", function(event){
    let query = event.target.value.toLowerCase()
    
    fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({query: query})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const matches = data.matches
        let foundOne = false
        document.querySelectorAll(".sideBarChatSelectThing").forEach(elem => {
            if (matches.includes(elem.chatId) && elem.id != "chatTemplate"){
                elem.style.display = "flex"
                foundOne = true
            }
            else{
                elem.style.display = "none"
            }
        })
        if (!foundOne){
            document.querySelector(".nofound").style.display = "block"
        }
        else{
            document.querySelector(".nofound").style.display = "none"
        }
    })
})

let promptinput = document.getElementById("input")

let promptImages = []

promptinput.addEventListener('keydown', handleEnterSubmit);
promptinput.onpaste = function(event){
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (var index in items) {
        var item = items[index];
        if (item.kind === 'file') {
            var blob = item.getAsFile();
            var reader = new FileReader();
            reader.onload = function (event) {
                promptImages.push(event.target.result)
                let newElem = createNewImageElement(event.target.result)

                promptinput.parentElement.appendChild(newElem)
            }; 
            reader.readAsDataURL(blob);
        }
    }
}

add_chat_message(systemPrompt, "system")

let newNode = messagesTree.addMessage({"role": "system", "content": systemPrompt})
newNode.tokens = 0

window.onbeforeunload = function(){
    saveSettings()
}












class TimeTracker {
    constructor() {
        this.startTime = null;
        this.totalTime = 0;
        this.isTracking = false;
        this.currentDate = new Date().toLocaleDateString();
    }

    // Start tracking time when tab becomes active
    startTracking() {
        if (!this.isTracking) {
            this.startTime = new Date();
            this.isTracking = true;
        }
    }

    // Stop tracking time when tab becomes inactive
    stopTracking() {
        if (this.isTracking) {
            const endTime = new Date();
            this.totalTime += endTime - this.startTime;
            this.isTracking = false;
            this.saveTime();
        }
    }

    // Save time to localStorage
    saveTime() {
        const timeData = JSON.parse(localStorage.getItem('websiteTimeTracker') || '{}');
        const currentDate = new Date().toLocaleDateString();
        
        timeData[currentDate] = (timeData[currentDate] || 0) + this.totalTime;
        localStorage.setItem('websiteTimeTracker', JSON.stringify(timeData));
    }

    // Get time spent for a specific date
    getTimeForDate(date) {
        const timeData = JSON.parse(localStorage.getItem('websiteTimeTracker') || '{}');
        return timeData[date] || 0;
    }

    // Format milliseconds to readable time
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
}

// Create tracker instance
const tracker = new TimeTracker();

// Add event listeners for visibility and focus changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        tracker.stopTracking();
    } else {
        tracker.startTracking();
    }
});

window.addEventListener('focus', () => {
    tracker.startTracking();
});

window.addEventListener('blur', () => {
    tracker.stopTracking();
});

// Start tracking when page loads
tracker.startTracking();

// Save time before page unloads
window.addEventListener('beforeunload', () => {
    tracker.stopTracking();
});

// Check for date change
setInterval(() => {
    const currentDate = new Date().toLocaleDateString();
    if (currentDate !== tracker.currentDate) {
        tracker.stopTracking();
        tracker.totalTime = 0;
        tracker.currentDate = currentDate;
        tracker.startTracking();
    }
}, 1000);

// Example: Display today's time spent
function displayTimeSpent() {
    const today = new Date().toLocaleDateString();
    const timeSpent = tracker.getTimeForDate(today);
    console.log(`Time spent today: ${tracker.formatTime(timeSpent)}`);
}



function getTimeData() {
    displayTimeSpent()
    
    const allData = JSON.parse(localStorage.getItem('websiteTimeTracker') || '{}');
    const sortedDates = Object.keys(allData).sort((a, b) => new Date(a) - new Date(b));
    const formattedData = {};
    
    sortedDates.forEach(date => {
        formattedData[date] = tracker.formatTime(allData[date]);
    });
    
    console.log('Formatted tracking data:', formattedData);
}


getTimeData()