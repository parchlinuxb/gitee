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
            "You are a Search Engine Assistant. that Engine called Gitee and based on SearXNG \n \
            – Always detect and respond in the user’s locale and language.  \n \
            – Keep replies concise, accurate, and on-point.  \n \
            – If you don’t know something, say “I’m sorry, I don’t know.”  \n \
            – Cite sources or URLs when you reference facts from external content.",
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
                "Mode: Chat  \n \
                Task: Answer the user’s question directly in a conversational style.  \n \
                - Do not invent facts.  \n \
                - No additional JSON or lists—just a natural-language reply. \n \
                - Then insert exactly one blank line, a line containing only the character “ɍ”, and another blank line. \n \
                - On the next line, emit a valid JSON array of the any referenced objects. Each object must have: \n \
                  • title: the page title or a concise descriptor \n \
                  • url: the source URL \n \
                Do not emit any other text before or after the JSON array. and dont use JSON code block",
        });
        sendMessage({ messageInput, stopButton, chatContainer, chatModel });
    }

    if (mode == "summarize") {
        messages.push({
            role: "system",
            content:
                "Mode: Summarize  \n \
                Task: \n \
                You will receive up to 5 search results (URL + snippet + etc). \n \
                Identify the 3 most relevant results for the user’s query. \n \
                Summarize those three results into a concise, informative paragraph in the user’s language. \n \
                Then insert exactly one blank line, a line containing only the character “ɍ”, and another blank line. \n \
                On the next line, emit a valid JSON array of the three referenced objects. Each object must have: \n \
                    • title: the page title or a concise descriptor \n \
                    • url: the source URL \n \
                Do not emit any other text before or after the JSON array. and dont use JSON code block",
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
    refrences?: { title: string; url: string }[]
) {
    const messageBox = document.createElement("div");
    messageBox.classList.add("message-box");
    messageBox.classList.add(role);
    const messageElement = document.createElement("div");
    messageElement.setAttribute("dir", "auto");
    messageElement.classList.add("message");
    messageBox.appendChild(messageElement);

    if (refrences) {
        const referenceElement = document.createElement("div");
        referenceElement.classList.add("reference");
        referenceElement.textContent = chatContainer.getAttribute(
            "data-gitee-based-on"
        );
        refrences.forEach((reference) => {
            const element = document.createElement("a");
            element.target = "_blank";
            element.href = reference.url;
            element.textContent = reference.title;
            referenceElement.appendChild(element);
        });
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
    const [content, references] = stream.choices[0].message.content.split("ɍ");

    const messageElement = createMessage(
        chatContainer,
        "ai",
        references ? JSON.parse(references) : undefined
    );
    let messageText: string = "";
    for (const chunk of content.split("\n")) {
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
