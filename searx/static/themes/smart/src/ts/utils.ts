export function copyToClipboard(item: ClipboardItem | string) {
    if (navigator.clipboard) {
        if (item instanceof ClipboardItem) {
            navigator.clipboard.write([item]);
        } else {
            navigator.clipboard.writeText(item);
        }
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
