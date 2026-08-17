export function $(selector: string) {
    return document.querySelector(selector);
}

export function $$(selector: string) {
    return document.querySelectorAll(selector);
}

export function copyToClipboard(item: ClipboardItem | string) {
    if (navigator.clipboard && item instanceof ClipboardItem) {
        navigator.clipboard.write([item]).catch(() => {
            alert("Clipboard access denied");
        });
        return;
    }

    if (typeof item !== "string") return;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(item).catch(() => {
            alert("Clipboard access denied");
        });
        return;
    }

    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = item;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand("copy");
    } catch {
        alert("Clipboard access denied");
    }
    document.body.removeChild(textarea);
}

export async function getFromClipboard(): Promise<string> {
    if (navigator.clipboard) {
        try {
            const text = await navigator.clipboard.readText();
            return text;
        } catch (e) {
            console.error(e);
            return "";
        }
    }

    alert("Clipboard not supported");
    return "";
}
