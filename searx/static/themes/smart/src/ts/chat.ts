import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { $ } from "./app";
import { OpenAI } from "openai";

let client: OpenAI;

let messages: ChatCompletionMessageParam[] = [
    {
        role: "system",
        content:
            "You are a Search Engine Assistant. You will answer questions about the search query.\
            dont answer like previous message. try to summarize the answer little bit",
    },
];

export function setupChat() {
    const chatContainer = $("#ai-message-container") as HTMLDivElement;
    if (!chatContainer) return;
    const sendMessageForm = $("#send-message") as HTMLFormElement;
    if (!sendMessageForm) return;
    const messageInput = sendMessageForm.querySelector(
        "input"
    ) as HTMLInputElement;
    if (!messageInput) return;
    const searchQuery = $("#search-query") as HTMLParagraphElement;
    if (!searchQuery) return;

    client = new OpenAI({
        apiKey: "FAKE",
        dangerouslyAllowBrowser: true,
        baseURL: "https://openai.jabirproject.org/v1",
    });

    sendMessage(messageInput, chatContainer, searchQuery.innerText).then(() =>
        chatContainer.classList.remove("loading")
    );

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
    messageBox.appendChild(messageElement);

    // TODO: improve this
    if (refrence) {
        const referenceElement = document.createElement("div");
        referenceElement.classList.add("reference");
        referenceElement.innerText = refrence;
        messageBox.appendChild(referenceElement);
    }

    chatContainer.appendChild(messageBox);

    return messageElement;
}

async function sendMessage(
    messageInput: HTMLInputElement,
    chatContainer: HTMLDivElement,
    message?: string
) {
    const userMessage = messageInput.value;
    if (!userMessage && !message) return;

    messages.push({
        role: "user",
        content: message || userMessage,
    });

    const stream = await client.chat.completions.create({
        // @ts-ignore
        model: "jabir-400b-online",
        messages,
        // do to some bugs right now i disabled it
        // stream: true,
    });

    const messageElement = createMessage(chatContainer, "ai");

    // for await (const chunk of stream) {
    //     const text = chunk.choices[0].delta.content || "";

    //     messageElement.innerText += text;
    // }\

    messageElement.innerText = stream.choices[0].message.content || "";

    if (messageElement.innerText.length <= 0) {
        messageElement.parentElement?.remove();
    }
}
