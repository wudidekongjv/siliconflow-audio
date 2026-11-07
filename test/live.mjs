// 真实端点验证：与插件完全相同的调用形态（WHATWG FormData + Blob + 只带 Authorization），
// 确认「浏览器里不手设 Content-Type」这条路是通的。
//
// Key 不写进仓库，运行时用环境变量给：
//   $env:SF_API_KEY='sk-...'; node test/live.mjs
import fs from "node:fs";

const KEY = process.env.SF_API_KEY || "";
const WAV = process.env.SF_TEST_WAV || "";

if (!KEY || !WAV) {
    console.log("跳过：需要 SF_API_KEY 和 SF_TEST_WAV 两个环境变量");
    process.exit(0);
}

function buildForm(model) {
    const form = new FormData();
    form.append("file", new Blob([fs.readFileSync(WAV)], { type: "audio/wav" }), "test.wav");
    form.append("model", model);
    return form;
}

async function run(model) {
    const response = await fetch("https://api.siliconflow.cn/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: "Bearer " + KEY },
        body: buildForm(model),
    });
    const body = await response.text();
    console.log(`${model} -> ${response.status} | ${body.slice(0, 160)}`);
    return response.status;
}

const a = await run("FunAudioLLM/SenseVoiceSmall");
const b = await run("TeleAI/TeleSpeechASR");

const bad = await fetch("https://api.siliconflow.cn/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: KEY },
    body: buildForm("FunAudioLLM/SenseVoiceSmall"),
});
console.log(`no-bearer -> ${bad.status} | ${(await bad.text()).slice(0, 160)}`);

process.exit(a === 200 && b === 200 ? 0 : 1);
