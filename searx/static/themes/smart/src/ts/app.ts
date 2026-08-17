import { $, copyToClipboard, getFromClipboard } from "./utils";
import debounce from "debounce";
import { setupInfiniteScroll } from "./infinite_scroll";

type Method = "GET" | "POST";

interface ClientSettings {
    ai_chat?: "off" | "chat" | "summarize";
    ai_chat_model?: string;
    ai_chat_api_url?: string;
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
        if (controler.signal.aborted) return;
        const query = queryInput.value;
        if (query.length < minChars) return;

        try {
            const formData = new FormData();
            formData.append("q", query);
            const res = await fetch("/autocompleter", {
                method: method,
                body: method === "POST" ? formData : undefined,
                signal: controler.signal,
            });
            const data: any[] = await res.json();
            suggestionsContainer.innerHTML = "";

            let suggestions: string[] = [];
            if (!data[0] || data[0].length < 1) return;
            suggestions.push(data[0] as string);

            if (data[1]) suggestions.push(...data[1]);

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
                        setSuggestion(
                            (e.target as HTMLButtonElement).innerText
                        );
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
        } catch {
            // fetch failed or aborted
        }
    }, 400);

    queryInput.addEventListener("input", getSuggestions, {
        signal: controler.signal,
    });
    queryInput.addEventListener("focus", getSuggestions, {
        signal: controler.signal,
    });

    let onSuggestion: boolean = false;

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

function setupChatModelSelect(chatModel: string, apiBaseUrl: string) {
    const modelSelect = $("#chat-model") as HTMLSelectElement;
    if (!modelSelect || !apiBaseUrl) return;

    fetch(`${apiBaseUrl}/models`)
        .then((res) => res.json())
        .then((data) => {
            modelSelect.innerHTML = "";
            for (const model of data.data || []) {
                const option = document.createElement("option");
                option.value = model.id;
                option.innerText = model.id.replace("-", " ");
                if (model.id === chatModel) option.selected = true;
                modelSelect.appendChild(option);
            }
        })
        .catch(() => {});
}

function getClientSettings(): ClientSettings {
    const clientSettings = $("#client-settings") as HTMLScriptElement;
    if (!clientSettings || !clientSettings.hasAttribute("settings")) return {};
    try {
        return JSON.parse(clientSettings.getAttribute("settings") || "{}");
    } catch {
        return {};
    }
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

    // chat - lazy loaded
    if (clientSettings.ai_chat && clientSettings.ai_chat !== "off") {
        const apiBaseUrl = clientSettings.ai_chat_api_url;
        if (apiBaseUrl) {
            import("./chat").then(({ setupChat }) => {
                setupChat({
                    chatModel: clientSettings.ai_chat_model ?? "",
                    mode: clientSettings.ai_chat,
                    apiBaseUrl,
                });
                if ($("#chat-model"))
                    setupChatModelSelect(
                        clientSettings.ai_chat_model ?? "",
                        apiBaseUrl
                    );
            });
        }
    }

    // infinite scroll
    if (clientSettings.infinite_scroll) setupInfiniteScroll();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", afterPageLoad);
} else {
    afterPageLoad();
}
