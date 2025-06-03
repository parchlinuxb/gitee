import axios, { AxiosResponse } from "axios";
import { $ } from "./utils";

let isLoading: boolean = false;
let failedTrys: number = 0;
const scrollController = new AbortController();

export function setupInfiniteScroll() {
    const mainContainer = $("#results") as HTMLDivElement;
    if (!mainContainer) return;

    mainContainer.addEventListener(
        "scroll",
        function () {
            if (
                mainContainer.scrollHeight - mainContainer.scrollTop <= 2000 &&
                !isLoading
            )
                requestNextPage();
        },
        { signal: scrollController.signal }
    );
}

function requestNextPage() {
    if (isLoading) return;
    isLoading = true;
    const form = document.querySelector(
        "#pagination form#next-page"
    ) as HTMLFormElement;
    if (!form) return;
    const formData = new FormData(form);

    $("#pagination")?.setAttribute("hidden", "");
    $("#page-loading")?.removeAttribute("hidden");

    axios
        .postForm(form.action, formData)
        .then(loadNextPage)
        .catch((reason) => {
            console.log(`Unable to load next page, ${reason}`);
            $("#pagination")?.removeAttribute("hidden");
            $("#page-loading")?.setAttribute("hidden", "");
            isLoading = false;
            failedTrys++;
            if (failedTrys > 3) scrollController.abort();
        });
}

function loadNextPage(reponse: AxiosResponse<string>) {
    if (reponse.status !== 200) return;
    const nextPageDoc = new DOMParser().parseFromString(
        reponse.data,
        "text/html"
    );
    const results =
        nextPageDoc.getElementsByClassName("results-container")[0].children;
    const paginationElement = nextPageDoc.getElementById("pagination");
    if (!results || !paginationElement) return;

    const prvPaginationElement = $("#pagination") as HTMLDivElement;
    prvPaginationElement.remove();

    const loadingIndicators = nextPageDoc.querySelector(
        "#page-loading"
    ) as HTMLDivElement;
    $("#page-loading")?.remove();
    const resultsContainer = $(".results-container") as HTMLDivElement;
    resultsContainer.append(...results);
    resultsContainer.appendChild(paginationElement);
    resultsContainer.appendChild(loadingIndicators);

    isLoading = false;
}
