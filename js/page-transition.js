
// ==========================================
// LAKBAYPANAHON
// SMOOTH PAGE TRANSITIONS
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Allow the page to fade in.
        requestAnimationFrame(() => {

            document.body.classList.add(
                "page-visible"
            );

        });


        // Find normal internal links.
        const links =
            document.querySelectorAll(
                'a[href]'
            );


        links.forEach((link) => {

            link.addEventListener(
                "click",
                (event) => {

                    const href =
                        link.getAttribute("href");


                    // Ignore links that should not
                    // receive page transitions.
                    if (
                        !href ||
                        href === "#" ||
                        href.startsWith("#") ||
                        href.startsWith("http://") ||
                        href.startsWith("https://") ||
                        href.startsWith("mailto:") ||
                        href.startsWith("tel:") ||
                        link.target === "_blank"
                    ) {
                        return;
                    }


                    // Allow modified clicks to behave
                    // normally.
                    if (
                        event.ctrlKey ||
                        event.metaKey ||
                        event.shiftKey ||
                        event.altKey
                    ) {
                        return;
                    }


                    event.preventDefault();


                    // Fade the current page out.
                    document.body.classList.remove(
                        "page-visible"
                    );

                    document.body.classList.add(
                        "page-leaving"
                    );


                    // Navigate after the short
                    // transition finishes.
                    setTimeout(
                        () => {

                            window.location.href =
                                href;

                        },
                        260
                    );

                }
            );

        });

    }
);


// ==========================================
// BACK/FORWARD CACHE FIX
// ==========================================

window.addEventListener(
    "pageshow",
    () => {

        document.body.classList.remove(
            "page-leaving"
        );

        requestAnimationFrame(() => {

            document.body.classList.add(
                "page-visible"
            );

        });

    }
);