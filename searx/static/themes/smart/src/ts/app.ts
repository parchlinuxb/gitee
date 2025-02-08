function reloadCSS() {
    const links = document.getElementsByTagName("link");

    Array.from(links)
        .filter((link) => link.rel.toLowerCase() === "stylesheet" && link.href)
        .forEach((link) => {
            const url = new URL(link.href, location.href);
            url.searchParams.set("forceReload", Date.now().toString());
            link.href = url.href;
        });
}
