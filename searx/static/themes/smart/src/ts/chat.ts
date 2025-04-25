import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { $ } from "./app";
import { OpenAI } from "openai";
import markdownit from "markdown-it";
import MarkdownIt from "markdown-it";
import axios from "axios";

let client: OpenAI;

let messages: ChatCompletionMessageParam[] = [
    {
        role: "system",
        content:
            "You are a Search Engine Assistant. You will answer questions about the search query.\
            dont answer like previous message. try to summarize the answer little bit",
    },
];

let md: MarkdownIt;

export function setupChat() {
    if (!localStorage.getItem("chat-model")) {
        localStorage.setItem("chat-model", "jabir-400b-online");
    }
    const chatContainer = $("#ai-message-container") as HTMLDivElement;
    if (!chatContainer) return;
    const sendMessageForm = $("#send-message") as HTMLFormElement;
    if (!sendMessageForm) return;
    const messageInput = sendMessageForm.querySelector(
        "input"
    ) as HTMLInputElement;
    if (!messageInput) return;
    const modelSelect = chatContainer.querySelector(
        "#chat-model"
    ) as HTMLSelectElement;
    if (!modelSelect) return;

    axios
        .get<{
            data: {
                id: string;
                object: string;
                owned_by: string;
            }[];
        }>("https://openai.jabirproject.org/v1/models")
        .then((res) => {
            modelSelect.innerHTML = "";
            for (const model of res.data.data) {
                const option = document.createElement("option");

                option.value = model.id;
                option.innerText = model.id.replace("-", " ");

                if (model.id === localStorage.getItem("chat-model"))
                    option.selected = true;

                modelSelect.appendChild(option);
            }
        });

    modelSelect.addEventListener("change", function () {
        localStorage.setItem("chat-model", modelSelect.value);
    });

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
    messageElement.setAttribute("dir", "auto");
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

    const userMessageElement = createMessage(chatContainer, "user");
    userMessageElement.innerText = message || userMessage;
    messageInput.value = "";

    const stream = await client.chat.completions.create({
        // @ts-ignore
        model: localStorage.getItem("chat-model"),
        messages,
    });

    if (!stream.choices[0].message.content) return;

    chatContainer.classList.remove("loading");
    const messageElement = createMessage(chatContainer, "ai");

    let messageText: string = "";
    for (const chunk of stream.choices[0].message.content.split("\n")) {
        const paragraph = document.createElement("p");
        messageElement.appendChild(paragraph);

        for (const token of chunk.split("")) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            messageText += token;
            paragraph.textContent += token;
        }
        messageText += "\n";

        paragraph.remove();
        messageElement.innerHTML = md.render(messageText);
    }

    if (messageElement.innerText.length <= 0) {
        messageElement.parentElement?.remove();
    }
}
