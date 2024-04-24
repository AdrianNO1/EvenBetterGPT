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

function messageToHTML(content){
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
        let nextSibling = obj.nextElementSibling
        obj.remove()
        messages.splice(obj.messageIndex, 1)
        
        messagesTree.branchOut(messagesTree.getNodeFromIndex(obj.messageIndex), update=false)
        messagesTree.removeNode(messagesTree.getNodeFromIndex(obj.messageIndex))
        messagesTree.updateTreant()
        updateTreeControl()

        while (nextSibling && nextSibling.classList.contains("messageContainer")){
            nextSibling.messageIndex -= 1
            nextSibling = nextSibling.nextElementSibling
        }

        updateArrows(nextSibling)
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
        if (element[1] > 1 || 1){
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

async function createNewChat(chatData) {
    try {
        const response = await fetch('/newchat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatData)
        });
        
        const data = await response.json();
        console.log('Response from server:', data);
        add_newchat_html(data.chatname)
        
    } catch (error) {
        console.error('Error creating new chat:', error);
    }
}

function runApiCall(messages, element){
    isGenerating = true
    const data = {
        model: "gpt-3.5-turbo",
        messages: messages,
        temperatue: 0,
        maxTokens: 400,

        chat: "test"
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
                let msg_obj = messagesTree.addMessage({"role": "assistant", "content": ""})
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

    branchOut(node, update=true){
        if (disableBranchingStuff){
            return
        }
        this.currentNode.marked = true
        function recursivlyCopy(node, main, newParent){
            let id = generateId()
            let newNode = new MessageNode(JSON.parse(JSON.stringify(node.message)), id)
            
            main.nodeIds[id] = newNode
            newNode.parent = newParent ?? node.parent;
            if (node.marked){
                main.currentNode.marked = false
                main.currentNode = newNode
                main.currentNode.parent.previouslySelectedChild = newNode
                let temp = main.currentNode
                while (temp != main.root){
                    temp.parent.previouslySelectedChild = temp
                    temp = temp.parent
                }
            }
            
            ;(newParent ?? node.parent).children.push(newNode)
            
            node.children.forEach(child => {
                recursivlyCopy(child, main, newNode)
            });
            // no idea if this works
            newNode.previouslySelectedChild = newNode.children[node.children.indexOf(node.previouslySelectedChild)]
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
        
        if (this.treant){
            this.treant.destroy()
        }
        this.treant = new Treant(chart_config);
    }
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

let editButtonsBottom = document.getElementsByClassName("editButtonsBottom")[0]
editButtonsBottom.querySelector(".generateButton").onclick = generate
editButtonsBottom.querySelector(".saveButton").onclick = save

let config = {
    container: "#tree-simple"
};
let parent_node = {
    text: { name: "Parent node" }
};
let first_child = {
    parent: parent_node,
    text: { name: "First child" }
};
let second_child = {
    parent: parent_node,
    text: { name: "Second child" }
};
let simple_chart_config = [
    config, parent_node, first_child,
    second_child,  
];

let buttonLine = document.getElementsByClassName("buttonLine")[0]
let settingsSelector = document.getElementsByClassName("settingsSelector")[0]
let currentButton = null

let disableBranchingStuff = false
if (disableBranchingStuff){
    document.getElementById("tree-simple").style.display = "none"
    buttonLine.style.display = "none"
}

// add event listener
settingsSelector.querySelector(".slider").addEventListener("input", function(){
    if (currentButton){
        currentButton.querySelector(".btnNumber").innerText = this.value
    }
})

buttonLine.querySelectorAll(".btnContainer").forEach(button => {
    button.onclick = function(){
        currentButton = button
        button.querySelector(".btnNumber").contentEditable = true
        button.querySelector(".btnNumber").addEventListener("keypress", function(event){
            if (event.which === 13){
                console.log("out")
                event.preventDefault()
                return
            }
            if (event.which !== 46 && isNaN(String.fromCharCode(event.which))){event.preventDefault(); return}
            settingsSelector.querySelector(".slider").value = event.target.innerText.toString() + event.key
        })
        var rect = button.getBoundingClientRect();
        console.log(rect.top, rect.right, rect.bottom, rect.left);
        settingsSelector.style.display = "block"
        settingsSelector.style.top = rect.bottom + "px"
        var centerX = rect.left + rect.width / 2;
        settingsSelector.style.left = centerX - settingsSelector.offsetWidth / 2 - 10 + "px"
    }
});


let isGenerating = false
let chatContainer = document.getElementById("chatContainer")
let templateContainer = document.getElementById("templates")

let messages = []
let messagesTree = new MessageTree()

let systemPrompt = `Patrick er en vittig, sarkastisk og respektløs AI med en mørk sans for humor. Han elsker smart ordspill, interne vitser og å gjøre narr av brukeren på en leken måte. Patrick er høyt intelligent og kunnskapsrik, men tar ikke seg selv eller noe annet altfor seriøst. Han bruker uformelt språk og tone, ofte med slang.

Når han svarer på brukerens inndata, vil Patrick ofte komme med vitser, gi spydige replikker og finne humoristiske måter å undergrave forventningene på. Han ser etter muligheter til å vri brukerens ord mot dem på morsomme måter.`


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


let promptinput = document.getElementById("input")

promptinput.addEventListener('keydown', handleEnterSubmit);

add_chat_message(systemPrompt, "system", 0)
messagesTree.addMessage({"role": "system", "content": systemPrompt})
