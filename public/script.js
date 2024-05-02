function handleEnterSubmit(event) {
    if (!isGenerating){
        if (event.which === 13 && !event.shiftKey) {
            event.preventDefault();
            let prompt = event.target.value
            event.target.value = ""
            add_chat_message(prompt, "user", messages.length);
            messagesTree.addMessage({"role": "user", "content": prompt})
            runApiCall(messages, add_chat_message("", "assistant", messages.length))
        }
    }
}

function messageToHTML(content){ // TODO: this is a mess
    return `<p>${content.replace("\n", "<br><br>")}</p>`
    total = ""
    
    content.split("\n").forEach(part => {
        total += `<p>${(part.trim().length == 0 ? "<br>" : part)}</p>`
    });
    return total
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
            add_chat_message(node.message.content, node.message.role, index)
            node = node.previouslySelectedChild
            index += 1
        }
        add_chat_message(node.message.content, node.message.role, index)
        messagesTree.currentNode = node

        messagesTree.updateTreant()
        messages = messagesTree.getMessagesList()
        updateTreeControl()
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
            add_chat_message(node.message.content, node.message.role, index)
            node = node.previouslySelectedChild
        }
        add_chat_message(node.message.content, node.message.role, index)
        messagesTree.currentNode = node

        messagesTree.updateTreant()
        messages = messagesTree.getMessagesList()
        updateTreeControl()
    }
}

function utilityUp(button){
    let obj = button.parentElement.parentElement.parentElement

    if (obj.previousElementSibling && obj.previousElementSibling.classList.contains("messageContainer")){
        obj.parentElement.insertBefore(obj, obj.previousElementSibling)
        updateArrows(obj)

        let temp = messages[obj.messageIndex]
        messages[obj.messageIndex] = messages[obj.messageIndex-1]
        messages[obj.messageIndex-1] = temp

        obj.messageIndex -= 1
        obj.nextElementSibling.messageIndex += 1
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

        obj.messageIndex += 1
        obj.previousElementSibling.messageIndex -= 1
    }
}

function utilityCopy(button){
    let obj = button.parentElement.parentElement.parentElement
    
    let text = messages[obj.messageIndex].content
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
        //let nextSibling = obj.nextElementSibling
        //obj.remove()
        //messages.splice(obj.messageIndex, 1)
        //
        ////messagesTree.branchOut(messagesTree.getNodeFromIndex(obj.messageIndex), update=false, deletedNodeId=messagesTree.getNodeFromIndex(obj.messageIndex).id) // you can't call functiosn like this
        //messagesTree.currentNode = messagesTree.getNodeFromIndex(obj.messageIndex).parent
        ////messagesTree.removeNode(messagesTree.getNodeFromIndex(obj.messageIndex))
        //messagesTree.updateTreant()
        //updateTreeControl()
//
        //while (nextSibling && nextSibling.classList.contains("messageContainer")){
        //    nextSibling.messageIndex -= 1
        //    nextSibling = nextSibling.nextElementSibling
        //}
//
        //updateArrows(nextSibling)



        obj.querySelector(".message").contentEditable = false
        obj.querySelector(".editButtons").style.display = "none"
        obj.querySelector(".utilityButtonContainer").style.display = "flex"
        obj.querySelector(".message").innerHTML = messageToHTML(obj.querySelector(".message").innerText)

        messagesTree.branchOut(messagesTree.getNodeFromIndex(obj.messageIndex-1))
        messagesTree.hardDeleteToNode(messagesTree.getNodeFromIndex(obj.messageIndex-1))
        messagesTree.updateTreant()
        updateTreeControl()
        messages.splice(obj.messageIndex + 1, messages.length - obj.messageIndex - 1)
        messages[obj.messageIndex].content = obj.querySelector(".message").innerText

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

    obj.querySelector(".message").contentEditable = true

    function generate(){
        if (isGenerating){
            return
        }
        obj.querySelector(".message").contentEditable = false
        obj.querySelector(".editButtons").style.display = "none"
        obj.querySelector(".utilityButtonContainer").style.display = "flex"
        obj.querySelector(".message").innerHTML = messageToHTML(obj.querySelector(".message").innerText)

        messagesTree.branchOut(messagesTree.getNodeFromIndex(obj.messageIndex))
        messagesTree.hardDeleteToNode(messagesTree.getNodeFromIndex(obj.messageIndex))
        messagesTree.updateTreant()
        messages.splice(obj.messageIndex + 1, messages.length - obj.messageIndex - 1)
        messages[obj.messageIndex].content = obj.querySelector(".message").innerText

        let nextSibling = obj.nextElementSibling
        while (nextSibling && nextSibling.classList.contains("messageContainer")){
            nextSibling = nextSibling.nextElementSibling
            nextSibling.previousElementSibling.remove()
        }
        runApiCall(messages, add_chat_message("", "assistant", messages.length))
    }

    function save(){
        obj.querySelector(".message").contentEditable = false
        obj.querySelector(".editButtons").style.display = "none"
        obj.querySelector(".utilityButtonContainer").style.display = "flex"
        obj.querySelector(".message").innerHTML = messageToHTML(obj.querySelector(".message").innerText)
        messagesTree.branchOut(messagesTree.getNodeFromIndex(obj.messageIndex))
        messages[obj.messageIndex].content = obj.querySelector(".message").innerText
        messagesTree.updateTreant()
    }

    function cancel(){
        obj.querySelector(".message").contentEditable = false
        obj.querySelector(".editButtons").style.display = "none"
        obj.querySelector(".utilityButtonContainer").style.display = "flex"
        obj.querySelector(".message").innerHTML = oldText
    }

    obj.querySelector(".generateButton").onclick = generate
    obj.querySelector(".saveButton").onclick = save
    obj.querySelector(".cancelButton").onclick = cancel
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
            chatContainer.children[index+1].querySelector(".treeControl").style.visibility = "visible"
        }
    });
}

function add_chat_message(content, user, index){
    let actualIndex = 0
    let current = chatContainer.children[1]
    while (current && current.classList.contains("messageContainer")){
        actualIndex += 1
        current = current.nextElementSibling
    }
    index = actualIndex
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
    }

    chatContainer.insertBefore(htmlObject, input)
    updateArrows(htmlObject)

    //htmlObject.onmouseover = function(){
    //    htmlObject.querySelector(".utilityButtonContainer").style.display = "block"
    //}
    
    return htmlObject.querySelector(".message")
}

function runApiCall(messages, element){
    isGenerating = true
    let msg_obj = messagesTree.addMessage({"role": "assistant", "content": ""})
    const data = {
        messages: messages,
        model: settings["model"],
        maxTokens: settings["maxTokens"],
        temperature: settings["temperature"],
        topP: settings["topP"],
        prescencePenalty: settings["prescencePenalty"],
        frequencyPenalty: settings["frequencyPenalty"],
        chatId: currentChatId,
        messagesTree: Flatted.stringify(messagesTree)
    };
    
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
                        if (done) {
                            controller.close();
                            isGenerating = false
                            messagesTree.updateTreant()
                            return;
                        }
                        controller.enqueue(value);
                        totalText += new TextDecoder().decode(value, { stream: true });
                        messages[messages.length-1].content = totalText
                        msg_obj.message.content = totalText
                        htmlContent = messageToHTML(totalText)
                        element.innerHTML = htmlContent
                        push();
                    }).catch(error => {
                        isGenerating = false
                        console.error('Error:', error);
                        controller.error(error);
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
    constructor(message, id, isRoot) {
        this.message = message;
        this.id = id;
        this.parent = null;
        this.children = [];
        this.previouslySelectedChild = null;
        this.isRoot = isRoot
    }
}

class MessageTree {
    constructor() {
        this.root = new MessageNode(null, "root", true);
        this.currentNode = this.root;
        this.nodeIds = {}
    }

    addMessage(message) {
        messages.push(message)
        let id = generateId()
        const newNode = new MessageNode(message, id);
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
        return newNode
    }

    branchOut(node, update=true, deletedNodeId=null){
        if (disableBranchingStuff){
            return
        }
        this.currentNode.marked = true
        function recursivlyCopy(node, main, newParent){
            let id = generateId()
            let newNode = new MessageNode(JSON.parse(JSON.stringify(node.message)), id)
            
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
                messages.push(node.message);
            }
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
        body: JSON.stringify({messages: Flatted.stringify(messagesTree), id: currentChatId})
    })
    .then(response => {
        if (!response.ok) {
            alert("Error saving chat")
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
                                selectChat(parentElement.children[1])
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
    if (promptinput.value){
        save()
    }
    if (!isGenerating){
        runApiCall(messages, add_chat_message("", "assistant"))
    }
}

function save(){
    if (promptinput.value){
        add_chat_message(promptinput.value, "user");
        messagesTree.addMessage({"role": "user", "content": promptinput.value})
        promptinput.value = ""
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

            document.querySelectorAll(".sideBarChatSelectThing").forEach(elem => {
                if (elem.id != "chatTemplate"){
                    if (elem.chatId == data.id){
                        let parentElement = elem.parentElement
                        if (elem.classList.contains("selected")){
                            selectChat(parentElement.children[1])
                        }
                    }
                }
            })
        }
    })
    .catch(error => {
        console.error(error);
    });

}

let editButtonsBottom = document.getElementsByClassName("editButtonsBottom")[0]
editButtonsBottom.querySelector(".generateButton").onclick = generate
editButtonsBottom.querySelector(".saveButton").onclick = save

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

let settingsLimits = {
    "gpt-3.5-turbo": defaultLimits,
    "gpt-4-turbo-2024-04-09": defaultLimits,
    "gpt-4-turbo": defaultLimits
}

settings["model"] = Object.keys(settingsLimits)[0]

let modelSelect = document.getElementsByClassName("modelSelect")[0]
for (let key in settingsLimits){
    modelSelect.innerHTML += `<option value="${key}">${key}</option>`
}

let buttonLine = document.getElementsByClassName("buttonLine")[0]
let settingsSelector = document.getElementsByClassName("settingsSelector")[0]
let settingsSlider = settingsSelector.querySelector(".slider")
let currentButton = null
let currentButtonName = null
let dontClose = false

let disableBranchingStuff = false
if (disableBranchingStuff){
    document.getElementById("tree-simple").style.display = "none"
    buttonLine.style.display = "none"
}

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
    unselectButtonLine()
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
            if (event.which === 13){
                event.preventDefault()
                return
            }
            if (event.which !== 46 && isNaN(String.fromCharCode(event.which))){event.preventDefault(); return}
            settingsSlider.value = event.target.innerText.toString() + event.key
            settings[buttonName] = parseFloat(event.target.innerText.toString() + event.key)
        })
    }
    else{
        button.querySelector(".modelSelect").addEventListener("change", function(event){
            settings["model"] = event.target.value
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
                settingsSelector.style.display = "flex"
                settingsSlider.min = buttonName == "maxTokens" ? 1 : 0
                let limit = settingsLimits[settings["model"]][buttonName]
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

let systemPrompt = `You are a helpful assistant.`

templateContainer.firstElementChild.querySelector(".yes").style.display = "none";
templateContainer.firstElementChild.querySelector(".no").style.display = "none";

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
    if (atStart){
        if (chatTemplate.parentElement.firstChild){
            chatTemplate.parentElement.insertBefore(newElem, chatTemplate.parentElement.firstChild);
        } else{
            chatTemplate.parentElement.appendChild(newElem);
        }
    } else {
        chatTemplate.parentElement.appendChild(newElem);
    }
    return newElem
}

function loadChat(chat){
    currentChatId = chat.id
    let newObj = Flatted.parse(chat.messages)
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
        add_chat_message(message.content, message.role, index)
    });
    updateTreeControl()

    settings = chat.chatSettings
    
    buttonLine.querySelectorAll(".btnContainer").forEach(button => {
        let buttonName = button.classList[1]
        buttonName = {"btnModelSelect": "model", "btnMaxTokens": "maxTokens", "btnTemperature": "temperature", "btnTopP": "topP", "btnPrescencePenalty": "prescencePenalty", "btnFrequencyPenalty": "frequencyPenalty"}[buttonName]
        if (buttonName != "model"){
            console.log(buttonName, settings[buttonName])
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
    if (data.topChat){
        loadChat(data.topChat)
    }
    else{
        createNewChat()
    }

    let i = 0
    data.chats.forEach(chat => {
        if (i == 0){
            let elem = sidebarNewChat(chat.name, chat.id)
            elem.classList.add("selected")
        } else{
            sidebarNewChat(chat.name, chat.id)
        }
        i++
    });
})

let promptinput = document.getElementById("input")

promptinput.addEventListener('keydown', handleEnterSubmit);

add_chat_message(systemPrompt, "system", 0)
messagesTree.addMessage({"role": "system", "content": systemPrompt})