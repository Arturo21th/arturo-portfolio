import fs from "node:fs";

const port = process.env.PORT || 9222;
const url = process.argv[2] || "http://localhost:4173";
const target = await fetch(`http://127.0.0.1:${port}/json`).then((res) => res.json()).then((pages) => pages.find((page) => page.type === "page"));

if (!target) throw new Error("No Chrome page found. Start Chrome with --remote-debugging-port=9222.");

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const send = (method, params = {}) => new Promise((resolve) => {
  const call = { id: ++id, method, params };
  const onMessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id === call.id) {
      ws.removeEventListener("message", onMessage);
      resolve(message.result);
    }
  };
  ws.addEventListener("message", onMessage);
  ws.send(JSON.stringify(call));
});

await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
await send("Page.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });

for (const viewport of [
  ["desktop", 1440, 1100, false],
  ["mobile", 390, 1200, true]
]) {
  const [name, width, height, mobile] = viewport;
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send("Page.navigate", { url: `${url}?qa=${Date.now()}-${name}` });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const result = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const offenders = [...document.querySelectorAll("*")]
        .map((el) => ({ tag: el.tagName, cls: String(el.className), right: Math.ceil(el.getBoundingClientRect().right), left: Math.floor(el.getBoundingClientRect().left) }))
        .filter((box) => box.right > innerWidth + 1 || box.left < -1)
        .slice(0, 10);
      return { innerWidth, scrollWidth: document.documentElement.scrollWidth, offenders };
    })()`
  });
  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(`qa-${name}.png`, Buffer.from(screenshot.data, "base64"));
  console.log(name, JSON.stringify(result.result.value));
}

ws.close();
