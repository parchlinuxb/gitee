import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { $ } from "./app";
import { OpenAI } from "openai";
import markdownit from "markdown-it";

let client: OpenAI;

let messages: ChatCompletionMessageParam[] = [
    {
        role: "system",
        content:
            "You are a Search Engine Assistant. You will answer questions about the search query.\
            dont answer like previous message. try to summarize the answer little bit",
    },
];

let md;

export function setupChat() {
    const chatContainer = $("#ai-message-container") as HTMLDivElement;
    if (!chatContainer) return;
    const sendMessageForm = $("#send-message") as HTMLFormElement;
    if (!sendMessageForm) return;
    const messageInput = sendMessageForm.querySelector(
        "input"
    ) as HTMLInputElement;
    if (!messageInput) return;

    client = new OpenAI({
        apiKey: "FAKE",
        dangerouslyAllowBrowser: true,
        baseURL: "https://openai.jabirproject.org/v1",
    });

    md = markdownit();

    sendMessage(messageInput, chatContainer);

    sendMessageForm.addEventListener("submit", function (e) {
        e.preventDefault();
        sendMessage(messageInput, chatContainer);
    });
}

function createMessage(
    chatContainer: HTMLDivElement,
    role: "user" | "ai",
    refrence?: string
) {
    const messageBox = document.createElement("div");
    messageBox.classList.add("message-box");
    messageBox.classList.add(role);
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.dir = "auto"; // Add this line to enable automatic direction
    messageBox.appendChild(messageElement);

    if (refrence) {
        const referenceElement = document.createElement("div");
        referenceElement.classList.add("reference");
        referenceElement.innerText = refrence;
        messageBox.appendChild(referenceElement);
    }

    chatContainer.appendChild(messageBox);
    return messageElement;
}

function isRTL(text: string): boolean {
    // Improved RTL detection including Persian/Farsi specific characters
    const rtlRegex = /[\u0591-\u07FF\u0800-\u086F\u08A0-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC\u200F\u202B\u202E]/;
    const matches = text.match(rtlRegex);
    
    // Remove markdown syntax and special characters before checking first character
    const cleanText = text.trim()
        .replace(/^[#*_`~\-+>|\d.)\]}]+/, '') // Remove markdown syntax from start
        .replace(/^\s+/, ''); // Remove any resulting leading whitespace
    
    // Get first actual character after cleaning
    const firstChar = cleanText[0];
    
    return !!(matches && matches.length > 0 && rtlRegex.test(firstChar));
}

async function sendMessage(
    messageInput: HTMLInputElement,
    chatContainer: HTMLDivElement,
    message?: string
) {
    const userMessage = messageInput.value;
    if (!userMessage && !message) return;

    const currentMessage = message || userMessage;
    messages.push({
        role: "user",
        content: currentMessage,
    });

    const userMessageElement = createMessage(chatContainer, "user");
    userMessageElement.innerText = currentMessage;
    userMessageElement.dir = isRTL(currentMessage) ? "rtl" : "ltr";
    messageInput.value = "";

    const stream = await client.chat.completions.create({
        // @ts-ignore
        model: "jabir-400b-online",
        messages,
    });

    if (!stream.choices[0].message.content) return;

    chatContainer.classList.remove("loading");
    const messageElement = createMessage(chatContainer, "ai");

    let messageText: string = "";
    let currentChunk = "";
    
    for (const chunk of stream.choices[0].message.content.split("\n")) {
        const paragraph = document.createElement("p");
        messageElement.appendChild(paragraph);
        currentChunk += chunk + "\n";
        paragraph.dir = isRTL(chunk) ? "rtl" : "ltr";

        for (const token of chunk.split("")) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            messageText += token;
            paragraph.textContent += token;
        }
        messageText += "\n";

        paragraph.remove();
        messageElement.innerHTML = md.render(messageText);
        messageElement.dir = isRTL(currentChunk) ? "rtl" : "ltr";
    }

    if (messageElement.innerText.length <= 0) {
        messageElement.parentElement?.remove();
    }
}
