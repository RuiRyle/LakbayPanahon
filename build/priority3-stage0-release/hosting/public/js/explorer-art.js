// Decorative, symbolic illustrations. Historical lesson imagery stays authored.
const artwork = {
    map: '<rect x="27" y="30" width="186" height="136" rx="8" fill="#f4e6c7"/><path d="m89 30-7 136m65-136 7 136" stroke="#cbb890" stroke-width="2"/><path d="m46 72 17-19 20 6 9 22-11 19-24-9zm65 39 16-15 24 8 9 21-22 12-22-10zm58-54 18-9 13 15-6 24-18-3z" fill="#79a891"/><path d="M65 78q16 71 64 42t57-49" stroke="#80663b" stroke-width="2" stroke-dasharray="4 6" fill="none"/><circle cx="65" cy="78" r="4" fill="#183b46"/><circle cx="129" cy="120" r="4" fill="#183b46"/><path d="M186 123v27m-13-14h26m-13-8 5 8-5 8-5-8z" stroke="#80663b" fill="none"/>',
    journal: '<path d="M57 28h115a13 13 0 0 1 13 13v127H60a14 14 0 0 1-14-14V40a12 12 0 0 1 11-12Z" fill="#326263"/><path d="M62 31v135" stroke="#b0c8ad" stroke-width="3"/><path d="M67 147h117v21H64a10 10 0 0 1 0-20" fill="#f4e6c7"/><path d="M78 155h97m-97 6h97" stroke="#cbb890"/><rect x="82" y="55" width="82" height="54" rx="4" fill="#f4e6c7"/><path d="M96 73h54m-54 10h54m-54 10h32" stroke="#8c805f" stroke-width="2"/><path d="m165 120 26-47 8 5-26 47-10 8z" fill="#dfb55d"/><path d="m163 133 10-8-8-5z" fill="#142e3b"/>',
    artifact: '<ellipse cx="120" cy="167" rx="62" ry="9" fill="#142e3b" opacity=".15"/><path d="M99 40h42v15l-8 7v12c49 18 45 74 15 88H92c-30-14-34-70 15-88V62l-8-7z" fill="#c89565"/><path d="M105 44h30M108 65h24M83 102q37 22 74 0M79 116q41 22 82 0M90 146h60" stroke="#77513a" stroke-width="3" fill="none"/><path d="M104 88c-15 9-19 26-16 39" stroke="#f3cf98" stroke-width="5" stroke-linecap="round" fill="none"/><rect x="88" y="167" width="64" height="9" rx="3" fill="#e3c480"/>',
    seal: '<circle cx="120" cy="96" r="42" fill="#dfb55d"/><circle cx="120" cy="96" r="31" fill="none" stroke="#fff1ce" stroke-width="2"/><path d="m105 96 10 10 22-23" stroke="#183b46" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><g stroke="#dfb55d" stroke-width="4"><path d="M120 24v19m0 106v19M48 96h19m106 0h19M69 45l13 13m76 76 13 13M69 147l13-13m76-76 13-13"/></g>'
};
export function explorerTheme(value) { return ['sea','forest','sand'].includes(value) ? value : 'sea'; }
export function createExplorerArt(kind) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 240 190');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    svg.classList.add('explorer-object-art');svg.innerHTML=artwork[kind]||artwork.map;
    return svg;
}
