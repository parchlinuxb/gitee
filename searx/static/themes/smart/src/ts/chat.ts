import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { OpenAI } from "openai";
import markdownit from "markdown-it";
import MarkdownIt from "markdown-it";
import Cookies from "js-cookie";
import { $ } from "./utils";

let client: OpenAI;

let messages: ChatCompletionMessageParam[] = [
    {
        role: "system",
        content:
            "Answer in language that give you in first word or language you think message comes in it.\
            You are a Search Engine Assistant. that Engine called Gitee and based on SearXNG",
    },
];

let md: MarkdownIt;

export function setupChat({
    mode,
    chatModel,
}: {
    mode: "chat" | "summarize";
    chatModel: string;
}) {
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
    if (modelSelect) {
        modelSelect.addEventListener("change", function () {
            Cookies.set("ai_chat_model", modelSelect.value);
        });
    }

    client = new OpenAI({
        apiKey: "FAKE",
        dangerouslyAllowBrowser: true,
        baseURL: "https://openai.jabirproject.org/v1",
    });
    md = markdownit();

    if (mode === "chat") {
        messages.push({
            role: "system",
            content:
                "You will answer questions about the search query.\
                dont answer like previous message. try to summarize the answer little bit",
        });
        sendMessage({ messageInput, chatContainer, chatModel });
    }

    if (mode == "summarize") {
        messages.push({
            role: "system",
            content:
                "You recive results and summarize it to 5-10 line text.\
                dont say anything more than that!",
        });
        messageInput.parentElement?.setAttribute("hidden", "");
        sendMessage({
            messageInput,
            chatContainer,
            chatModel,
            summarize: true,
        });
        return;
    }

    sendMessageForm.addEventListener("submit", function (e) {
        e.preventDefault();
        sendMessage({ messageInput, chatContainer, chatModel });
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

async function sendMessage({
    messageInput,
    chatContainer,
    chatModel,
    message,
    summarize,
}: {
    messageInput?: HTMLInputElement;
    chatContainer: HTMLDivElement;
    chatModel: string;
    message?: string;
    summarize?: boolean;
}) {
    const userMessage = messageInput ? messageInput.value : undefined;
    const sededMessage = message ?? userMessage;
    if (!sededMessage) return;

    messages.push({
        role: "user",
        content: sededMessage,
    });

    if (messageInput) messageInput.value = "";
    if (!summarize) {
        const userMessageElement = createMessage(chatContainer, "user");
        userMessageElement.innerText = sededMessage;
    }

    const stream = await client.chat.completions.create({
        // @ts-ignore
        model: chatModel,
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
