import Cookies from "js-cookie";
import { $ } from "./utils";

let apiUrl = "";
let messages: { role: string; content: string }[] = [
    {
        role: "system",
        content: `You are a Search Engine Assistant. The engine is called Gitee and is based on SearXNG.
            - Always detect and respond in the user's locale and language.
            - Keep replies concise, accurate, and on-point.
            - If you don't know something, say "I'm sorry, I don't know."
            - Cite sources or URLs when you reference facts from external content.`,
    },
];

function renderMarkdown(text: string): string {
    // Simple markdown rendering without external dependency
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br>");
}

export function setupChat({
    mode,
    chatModel,
    apiBaseUrl,
}: {
    mode: "chat" | "summarize";
    chatModel: string;
    apiBaseUrl?: string;
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

    apiUrl = apiBaseUrl || "";

    if (mode === "chat") {
        messages.push({
            role: "system",
            content: [
                "Mode: Chat",
                "Task: Answer the user's question directly in a conversational style.",
                "- Do not invent facts.",
                "- No additional JSON or lists - just a natural-language reply.",
                "- Then insert exactly one blank line, a line containing only the character '|', and another blank line.",
                "- On the next line, emit a valid JSON array of the any referenced objects. Each object must have:",
                "  * title: the page title or a concise descriptor",
                "  * url: the source URL",
                "Do not emit any other text before or after the JSON array. and dont use JSON code block",
            ].join(" "),
        });
        sendMessage({ messageInput, stopButton, chatContainer, chatModel });
    }

    if (mode == "summarize") {
        messages.push({
            role: "system",
            content: [
                "Mode: Summarize",
                "Task: You will receive up to 5 search results (URL + snippet + etc).",
                "Identify the 3 most relevant results for the user's query.",
                "Summarize those three results into a concise, informative paragraph in the user's language.",
                "Then insert exactly one blank line, a line containing only the character '|', and another blank line.",
                "On the next line, emit a valid JSON array of the three referenced objects. Each object must have:",
                "    * title: the page title or a concise descriptor",
                "    * url: the source URL",
                "Do not emit any other text before or after the JSON array. and dont use JSON code block",
            ].join(" "),
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

    if (!apiUrl) {
        const messageElement = createMessage(chatContainer, "ai");
        messageElement.innerText = "AI API URL is not configured.";
        chatContainer.classList.remove("answering");
        if (messageInput) messageInput.disabled = false;
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: chatModel,
                messages,
                stream: false,
            }),
            signal: controller.signal,
        });

        chatContainer.classList.remove("loading");

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) return;

        const [answer, references] = content.split("ɍ");

        const messageElement = createMessage(
            chatContainer,
            "ai",
            references
                ? (() => {
                      try {
                          return JSON.parse(references);
                      } catch {
                          return undefined;
                      }
                  })()
                : undefined
        );

        // Batched rendering - O(n) instead of O(n²)
        const BATCH_SIZE = 5;
        const chars = answer.split("");
        let messageText = "";

        for (let i = 0; i < chars.length; i += BATCH_SIZE) {
            const batch = chars.slice(i, i + BATCH_SIZE).join("");
            messageText += batch;
            messageElement.innerHTML = renderMarkdown(messageText);
            await new Promise((resolve) => requestAnimationFrame(resolve));
        }

        chatContainer.classList.remove("answering");
        if (messageInput) messageInput.disabled = false;

        if (messageElement.innerText.length <= 0) {
            messageElement.parentElement?.remove();
        }
    } catch (e: any) {
        const messageElement = createMessage(chatContainer, "ai");
        messageElement.innerText = controller.signal.aborted
            ? chatContainer.getAttribute("data-gitee-stop") ?? "Stopped"
            : e.message;
        chatContainer.classList.remove("answering");
        if (messageInput) messageInput.disabled = false;
    }
}

export async function fetchModels(apiBaseUrl: string): Promise<string[]> {
    try {
        const response = await fetch(`${apiBaseUrl}/models`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.data?.map((m: any) => m.id) || [];
    } catch {
        return [];
    }
}
