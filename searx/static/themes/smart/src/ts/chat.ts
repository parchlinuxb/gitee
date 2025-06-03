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
    const stopButton = $("#ai-stop") as HTMLButtonElement;
    if (!stopButton) return;

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
        sendMessage({ messageInput, stopButton, chatContainer, chatModel });
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
            stopButton,
            chatModel,
            summarize: true,
        });
        return;
    }

    sendMessageForm.addEventListener("submit", function (e) {
        e.preventDefault();
        sendMessage({ messageInput, stopButton, chatContainer, chatModel });
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
    stopButton,
    chatModel,
    message,
    summarize,
}: {
    messageInput?: HTMLInputElement;
    chatContainer: HTMLDivElement;
    stopButton: HTMLButtonElement;
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
        userMessageElement.innerText = sededMessage.includes("Query:")
            ? sededMessage.substring(sededMessage.indexOf("Query:") + 6)
            : sededMessage;
    }

    const controller = new AbortController();
    stopButton.addEventListener(
        "click",
        function () {
            controller.abort();
        },
        { signal: controller.signal }
    );

    chatContainer.classList.add("answering");
    if (messageInput) messageInput.disabled = true;
    const stream = await client.chat.completions
        .create(
            {
                // @ts-ignore
                model: chatModel,
                messages,
            },
            {
                signal: controller.signal,
            }
        )
        .catch((e) => {
            const messageElement = createMessage(chatContainer, "ai");
            messageElement.innerText = controller.signal.aborted
                ? chatContainer.getAttribute("data-gitee-stop") ?? e.message
                : e.message;
            chatContainer.classList.remove("answering");
            if (messageInput) messageInput.disabled = false;
        });

    chatContainer.classList.remove("loading");

    if (!stream?.choices[0].message.content) return;
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
    chatContainer.classList.remove("answering");
    if (messageInput) messageInput.disabled = false;

    if (messageElement.innerText.length <= 0) {
        messageElement.parentElement?.remove();
    }
}
