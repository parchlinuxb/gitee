import { checkImagePage } from "./images";
import { copyToClipboard, getFromClipboard } from "./utils";

export function $(selector: string) {
    return document.querySelector(selector);
}

export function $$(selector: string) {
    return document.querySelectorAll(selector);
}

checkImagePage();

function afterPageLoad() {
    // check for preferences page
    if ($("#preferences")) {
        // check for preferences hash
        const hashInput = $("#preferences-hash") as HTMLInputElement;
        if (!hashInput) return;
        const copyBtn = $("#copy-preferences-hash") as HTMLButtonElement;
        if (!copyBtn) return;
        copyBtn.addEventListener("click", function () {
            copyToClipboard(hashInput.value);
            copyBtn.innerText = copyBtn.getAttribute(
                "data-copied-text"
            ) as string;
            setTimeout(() => {
                copyBtn.innerText = copyBtn.getAttribute(
                    "data-copy-text"
                ) as string;
            }, 2000);
        });
        const pasteBtn = $("#paste-preferences-hash") as HTMLButtonElement;
        const pasteInput = $(
            "#paste-preferences-hash-input"
        ) as HTMLInputElement;
        if (!pasteBtn || !pasteInput) return;
        pasteBtn.addEventListener("click", async function () {
            const hash = await getFromClipboard();
            pasteInput.value = hash;
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", afterPageLoad);
} else {
    afterPageLoad();
}
