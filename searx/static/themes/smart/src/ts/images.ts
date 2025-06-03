import { $, $$ } from "./utils";
import { copyToClipboard } from "./utils";
import debounce from "debounce";

interface ImageDetails {
    imageSrc: HTMLImageElement;
    imageTitle: HTMLSpanElement;
    imageContent: HTMLSpanElement;
    imageSource: HTMLLinkElement;
    imageFilesize: HTMLSpanElement;
    imageDownload: HTMLLinkElement;
    formatSpan: HTMLSpanElement;
    filesizeSpan: HTMLSpanElement;
    engineSpan: HTMLSpanElement;
    previewImg: HTMLImageElement;
}

function handleImageDetails(
    image: HTMLElement,
    {
        imageSrc,
        imageTitle,
        imageContent,
        imageSource,
        imageFilesize,
        imageDownload,
        formatSpan,
        filesizeSpan,
        engineSpan,
        previewImg,
    }: ImageDetails
) {
    const resultsContainer = $("#results") as HTMLDivElement;
    resultsContainer.classList.add("image-open");

    imageSrc.src = "";
    previewImg.src = image.getAttribute("data-gitee-thumbnail") as string;
    imageSrc.src = image.getAttribute("data-gitee-src") as string;
    imageTitle.innerText = image.getAttribute("data-gitee-title") as string;
    imageContent.innerText = image.getAttribute("data-gitee-content") as string;

    if (image.hasAttribute("data-gitee-format")) {
        formatSpan.innerText = image.getAttribute(
            "data-gitee-format"
        ) as string;
    } else {
        formatSpan.innerText = "Unknown";
    }

    if (image.hasAttribute("data-gitee-filesize")) {
        if (imageFilesize.hasAttribute("hidden"))
            imageFilesize.setAttribute("hidden", "");

        filesizeSpan.innerText = image.getAttribute(
            "data-gitee-filesize"
        ) as string;
    } else {
        imageFilesize.setAttribute("hidden", "");
    }

    imageSource.href = image.getAttribute("data-gitee-source") as string;
    imageDownload.href = image.getAttribute("data-gitee-src") as string;
    engineSpan.innerText = image.getAttribute("data-gitee-engine") as string;
}

function setupImages(resultsContainer: HTMLElement) {
    const imageSrc = $("#image-src") as HTMLImageElement;
    const previewImg = $("#preview-img") as HTMLImageElement;
    const imageTitle = $("#image-title") as HTMLHeadingElement;
    const imageContent = $("#image-content") as HTMLParagraphElement;
    const imageFormat = $("#image-format") as HTMLDivElement;
    const imageFilesize = $("#image-filesize") as HTMLDivElement;
    const imageSource = $("#image-source") as HTMLLinkElement;
    const imageDownload = $("#image-download") as HTMLLinkElement;
    const imageCopy = $("#image-copy") as HTMLButtonElement;

    const formatSpan = imageFormat.getElementsByClassName(
        "value"
    )[0] as HTMLSpanElement;
    const filesizeSpan = imageFilesize.getElementsByClassName(
        "value"
    )[0] as HTMLSpanElement;
    const engineSpan = $("#image-engine") as HTMLSpanElement;

    const ImagesObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach((element) => {
                    if (!(element instanceof HTMLElement)) return;
                    if (element.classList.contains("images_group")) {
                        element.childNodes.forEach((node) =>
                            node.addEventListener("click", (e) => {
                                e.preventDefault();
                                removePrvImageClass();
                                element.classList.add("current-open");
                                element.scrollIntoView({
                                    behavior: "smooth",
                                    block: "nearest",
                                });
                                handleImageDetails(element, {
                                    imageSrc,
                                    imageTitle,
                                    imageContent,
                                    imageSource,
                                    imageFilesize,
                                    imageDownload,
                                    filesizeSpan,
                                    formatSpan,
                                    engineSpan,
                                    previewImg,
                                });
                            })
                        );
                    }
                });
            }
        }
    });

    ImagesObserver.observe(resultsContainer, {
        childList: true,
        subtree: true,
    });

    $$(".image").forEach((node) => {
        if (node.tagName !== "A" || !(node instanceof HTMLElement)) return;
        void node.addEventListener("click", (e) => {
            e.preventDefault();
            removePrvImageClass();
            node.classList.add("current-open");
            node.scrollIntoView({ behavior: "smooth", block: "nearest" });
            handleImageDetails(node, {
                imageSrc,
                imageTitle,
                imageContent,
                imageSource,
                imageFilesize,
                imageDownload,
                filesizeSpan,
                formatSpan,
                engineSpan,
                previewImg,
            });
        });
    });

    // Copy not working at localhost and only works in HTTPS pages
    if (location.protocol === "http:") {
        imageCopy.setAttribute("disabled", "true");
    }
    imageCopy.addEventListener("click", () => {
        const canvas = document.createElement("canvas");
        canvas.width = imageSrc.width;
        canvas.height = imageSrc.height;
        (canvas.getContext("2d") as CanvasRenderingContext2D).drawImage(
            imageSrc,
            0,
            0,
            imageSrc.width,
            imageSrc.height
        );
        canvas.toBlob((blob) => {
            if (!blob) return;
            copyToClipboard(new ClipboardItem({ "image/png": blob }));
        });
        void canvas.remove();
    });

    const bodyContainer = $("#results") as HTMLDivElement;
    const imageDetailsContainer = $("#image-details") as HTMLDivElement;
    bodyContainer.addEventListener(
        "scroll",
        debounce(function () {
            if (bodyContainer.scrollTop < 50) {
                imageDetailsContainer.style.top = "0px";
                imageDetailsContainer.style.height = "80vh";
                return;
            }
            imageDetailsContainer.style.height = "95vh";
            imageDetailsContainer.style.top = `calc(${bodyContainer.scrollTop}px - 15vh)`;
        }, 500)
    );

    imageDetailsContainer
        .getElementsByClassName("close")[0]
        .addEventListener("click", function () {
            removePrvImageClass();
            bodyContainer.classList.remove("image-open");
        });

    function removePrvImageClass() {
        const currentOpen =
            resultsContainer.getElementsByClassName("current-open")[0];
        if (currentOpen) currentOpen.classList.remove("current-open");
    }
}

(function checkImagePage() {
    const resultsContainer = $(".results-container");
    if (!resultsContainer || resultsContainer.nodeType !== Node.ELEMENT_NODE)
        return;
    if (resultsContainer.classList.contains("image-page"))
        setupImages(resultsContainer as HTMLDivElement);
})();
