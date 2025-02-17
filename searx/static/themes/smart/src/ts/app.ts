import { checkImagePage } from "./images";

export function $(selector: string) {
    return document.querySelector(selector);
}

export function $$(selector: string) {
    return document.querySelectorAll(selector);
}

checkImagePage();

document.addEventListener("DOMContentLoaded", function () {});
