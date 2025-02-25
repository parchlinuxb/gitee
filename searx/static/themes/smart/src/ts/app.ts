import { setupChat } from "./chat";
import { checkImagePage } from "./images";
import { copyToClipboard, getFromClipboard } from "./utils";
import debounce from "debounce";
import axios, { AxiosResponse } from "axios";

export function $(selector: string) {
    return document.querySelector(selector);
}

export function $$(selector: string) {
    return document.querySelectorAll(selector);
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

function setupSuggestion() {
    const queryInput = $("#q") as HTMLInputElement;
    if (!queryInput) return;
    const suggestionsContainer = $("#suggestion") as HTMLDivElement;
    if (!suggestionsContainer) return;

    function setSuggestion(e: Event) {
        queryInput.value = (e.target as HTMLButtonElement).innerText;
        queryInput.focus();
    }

    const getSuggestions = debounce(async function () {
        const query = queryInput.value;
        const res = await axios.post<Array<string | string[]>>(
            "/autocompleter",
            `q=${query}`
        );
        suggestionsContainer.innerHTML = "";

        let suggestions: string[] = [];
        if (res.data[0].length < 1) return;
        suggestions.push(res.data[0] as string);

        if (res.data[1]) suggestions.push(...res.data[1]);

        suggestions.forEach((item) => {
            const itemElement = document.createElement("button");
            itemElement.setAttribute("type", "button");
            itemElement.innerText = item;
            suggestionsContainer.appendChild(itemElement);
            itemElement.addEventListener("click", setSuggestion);
            itemElement.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    setSuggestion(e);
                }
            });
        });
    }, 400);

    queryInput.addEventListener("input", getSuggestions);
    queryInput.addEventListener("focus", getSuggestions);
    queryInput.addEventListener("blur", function () {
        suggestionsContainer.innerHTML = "";
    });
}

checkImagePage();

function afterPageLoad() {
    // preferences page
    if ($("#preferences")) setupPreferencesPage();

    // search page
    if ($("#results")) setupShareBtn();

    // index page
    if ($("#index")) setupCategorySelection();

    // if there is search box
    if ($("#search")) setupSuggestion();

    // chat
    setupChat();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", afterPageLoad);
} else {
    afterPageLoad();
}
