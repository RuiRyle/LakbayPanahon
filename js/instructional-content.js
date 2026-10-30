import {refreshInstructionalContent} from "./instructional-snapshot.js";
export {instructionalSnapshot,refreshInstructionalContent} from "./instructional-snapshot.js";
// Teachers' edits appear after two minutes, or immediately after this refresh.

const heading = document.querySelector("main h1");
if (heading) {
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "text-button";
    refresh.textContent = "Refresh Learning Content";
    refresh.addEventListener("click", () => {
        refreshInstructionalContent();
        window.location.reload();
    });
    heading.after(refresh);
}
