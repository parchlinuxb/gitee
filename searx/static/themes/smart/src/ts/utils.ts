export function $(selector: string) {
    return document.querySelector(selector);
}

export function $$(selector: string) {
    return document.querySelectorAll(selector);
}

export function copyToClipboard(item: ClipboardItem | string) {
    if (navigator.clipboard && item instanceof ClipboardItem) {
        navigator.permissions
            // @ts-ignore
            .query({ name: "clipboard-write" })
            .then((result) => {
                if (result.state === "granted" || result.state === "prompt") {
                    navigator.clipboard.write([item]);
                } else {
                    alert("Clipboard unaccessible");
                }
            });
        return;
    }

    if (typeof item !== "string") return;
    const textarea = document.createElement("textarea");
    textarea.value = item;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
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
