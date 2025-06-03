import { setupChat } from "./chat";
import { $, copyToClipboard, getFromClipboard } from "./utils";
import debounce from "debounce";
import axios from "axios";
import { setupInfiniteScroll } from "./infinite_scroll";

type Method = "GET" | "POST";

interface ClientSettings {
    ai_chat?: "off" | "chat" | "summarize";
    ai_chat_model?: string;
    advanced_search?: boolean;
    autocomplete?: string;
    autocomplete_min?: number;
    infinite_scroll?: boolean;
    method?: Method;
}

function setupShareBtn() {
    const shareBtn = $("#share-url-btn") as HTMLButtonElement;
    if (!shareBtn) return;
    shareBtn.addEventListener("click", function () {
        const searchUrl = shareBtn.getAttribute("data-search-url");
        if (!searchUrl) return;
        copyToClipboard(searchUrl);
        const copiedText = shareBtn.getAttribute("data-gitee-copied");
        if (!copiedText) return;
        shareBtn.setAttribute("tooltip", copiedText);
        setTimeout(() => {
            shareBtn.removeAttribute("tooltip");
        }, 2000);
    });
}

function setupPreferencesPage() {
    // check for preferences hash
    const hashInput = $("#preferences-hash") as HTMLInputElement;
    if (!hashInput) return;
    const copyBtn = $("#copy-preferences-hash") as HTMLButtonElement;
    if (!copyBtn) return;
    copyBtn.addEventListener("click", function () {
        copyToClipboard(hashInput.value);
        copyBtn.innerText = copyBtn.getAttribute("data-copied-text") as string;
        setTimeout(() => {
            copyBtn.innerText = copyBtn.getAttribute(
                "data-copy-text"
            ) as string;
        }, 2000);
    });
    const pasteBtn = $("#paste-preferences-hash") as HTMLButtonElement;
    const pasteInput = $("#paste-preferences-hash-input") as HTMLInputElement;
    if (!pasteBtn || !pasteInput) return;
    pasteBtn.addEventListener("click", async function () {
        const hash = await getFromClipboard();
        pasteInput.value = hash;
    });
}

function setupCategorySelection() {
    if (!$("#search_categories")) return;
    const categoriesContainer = $("#search_categories") as HTMLDivElement;

    const categories = categoriesContainer.getElementsByClassName(
        "category"
    ) as HTMLCollectionOf<HTMLLabelElement>;
    if (categories.length < 2) return;

    for (const category of categories) {
        category.addEventListener("click", function (e) {
            e.preventDefault();

            for (const category of categories) {
                const checkBox = category.querySelector(
                    'input[type="checkbox"]'
                ) as HTMLInputElement;
                if (!checkBox) return;
                checkBox.removeAttribute("checked");
            }

            const checkBox = category.querySelector(
                'input[type="checkbox"]'
            ) as HTMLInputElement;
            if (!checkBox) return;
            checkBox.setAttribute("checked", "");
        });
    }
}

function setupSuggestion({
    minChars,
    method,
}: {
    minChars: number;
    method: Method;
}) {
    const formElement = $("#search") as HTMLFormElement;
    if (!formElement) return;
    const queryInput = $("#q") as HTMLInputElement;
    if (!queryInput) return;
    const suggestionsContainer = $("#suggestion") as HTMLDivElement;
    if (!suggestionsContainer) return;

    const controler = new AbortController();

    function setSuggestion(text: string, focus = true) {
        queryInput.value = text;
        if (focus) queryInput.focus();
    }

    const getSuggestions = debounce(async function () {
        onSuggestion = false;
        if (controler.signal.aborted) return;
        const query = queryInput.value;
        if (query.length < minChars) return;
        const res = await axios<Array<string | string[]>>({
            url: "/autocompleter",
            method,
            data: `q=${query}`,
        });
        suggestionsContainer.innerHTML = "";

        let suggestions: string[] = [];
        if (res.data[0].length < 1) return;
        suggestions.push(res.data[0] as string);

        if (res.data[1]) suggestions.push(...res.data[1]);

        suggestions.forEach((item) => {
            const itemElement = document.createElement(
                "button"
            ) as HTMLButtonElement;
            itemElement.setAttribute("type", "button");
            itemElement.innerText = item;
            suggestionsContainer.appendChild(itemElement);
            itemElement.addEventListener("click", function (e) {
                setSuggestion((e.target as HTMLButtonElement).innerText);
                controler.abort();
                formElement.submit();
            });
            itemElement.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    setSuggestion((e.target as HTMLButtonElement).innerText);
                    controler.abort();
                    formElement.submit();
                } else if (e.key === "ArrowDown") {
                    const currentButton = e.target as HTMLButtonElement;
                    const nextButton =
                        currentButton.nextSibling as HTMLButtonElement | null;
                    if (!nextButton) return;
                    setSuggestion(nextButton.innerText, false);
                    nextButton.focus();
                } else if (e.key === "ArrowUp") {
                    const currentButton = e.target as HTMLButtonElement;
                    const previousButton =
                        currentButton.previousSibling as HTMLButtonElement | null;
                    if (previousButton) {
                        setSuggestion(previousButton.innerText, false);
                        previousButton.focus();
                    } else {
                        queryInput.focus();
                    }
                } else {
                    queryInput.focus();
                }
            });
        });
    }, 400);

    queryInput.addEventListener("input", getSuggestions, {
        signal: controler.signal,
    });
    queryInput.addEventListener("focus", getSuggestions, {
        signal: controler.signal,
    });

    let onSuggestion: Boolean = false;

    queryInput.addEventListener("blur", function () {
        if (onSuggestion) return;
        setTimeout(() => {
            suggestionsContainer.innerHTML = "";
        }, 300);
    });

    suggestionsContainer.addEventListener("focusout", function () {
        debounce(function () {
            if (!onSuggestion) return;
            onSuggestion = false;
            suggestionsContainer.innerHTML = "";
        }, 300);
    });

    queryInput.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") {
            onSuggestion = true;
            e.preventDefault();
            if (suggestionsContainer.children.length <= 1) return;
            const button = suggestionsContainer
                .children[0] as HTMLButtonElement;
            button.focus();
        }
    });
}

function setupChatModelSelect(chatModel: string) {
    const modelSelect = $("#chat-model") as HTMLSelectElement;
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

                if (model.id === chatModel) option.selected = true;

                modelSelect.appendChild(option);
            }
        });
}

function getClientSettings(): ClientSettings {
    const clientSettings = $("#client-settings") as HTMLScriptElement;
    if (!clientSettings || !clientSettings.hasAttribute("settings")) return {};
    return JSON.parse(atob(clientSettings.getAttribute("settings") || ""));
}

function afterPageLoad() {
    const clientSettings = getClientSettings();

    // preferences page
    if ($("#preferences")) setupPreferencesPage();

    // search page
    if ($("#results")) setupShareBtn();

    // index page
    if ($("#index")) setupCategorySelection();

    // suggestion
    if (clientSettings.autocomplete !== "")
        setupSuggestion({
            minChars: clientSettings.autocomplete_min ?? 1,
            method: clientSettings.method ?? "POST",
        });

    // chat
    if (clientSettings.ai_chat && clientSettings.ai_chat !== "off") {
        setupChat({
            chatModel: clientSettings.ai_chat_model ?? "jabir-400b-online",
            mode: clientSettings.ai_chat,
        });
        if ($("#chat-model"))
            setupChatModelSelect(
                clientSettings.ai_chat_model ?? "jabir-400b-online"
            );
    }

    // infinite scroll
    if (clientSettings.infinite_scroll) setupInfiniteScroll();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", afterPageLoad);
} else {
    afterPageLoad();
}
