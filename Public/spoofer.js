
function HandleRequestURL (url) {
    if (url.includes("news/pucks.json"))url = "/api/GetDiscordInvite/?version=870";
    if (url.includes("news/bumpyball.json"))url = "/api/GetDiscordInvite/?version=890";
    if (url.includes("/Listing")) url = "/api/Listing/";
    if (url.includes("/Leaderboard"))url = "/api/Leaderboard/";
    if (url.includes("/Ping"))url = "/api/Ping/";
    if (url.includes("/GetPlayerRecord"))url = "/api/GetPlayerRecord/";
    return url;
}

XMLHttpRequest.prototype.o = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method,url) {
    url = HandleRequestURL(url);
    return this.o(...arguments);
}
const fetch_ = fetch;
fetch = function (url) {
    url = HandleRequestURL(url);
    return fetch_(...arguments);
}
const WebSocket_Clone = WebSocket;
WebSocket = function (url,ptr) {
    if (url.includes("/server")) {
        let urlObject = new URL(url);
        url = "ws://" + urlObject.host
    }
    let ws = new WebSocket_Clone(url,ptr);
    console.log(url);
    return ws;
}