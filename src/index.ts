require('dotenv').config();
import puppeteer from 'puppeteer';
import { restoreCookies, saveCookies } from './cookies';
import express from "express";
import axios from 'axios';
const app = express();

async function openMicrosoftWindow(base: puppeteer.Page, url: string) {
    if (process.env.NO_WINDOW)
        throw new Error("No window mode enabled");
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--app=https://my.epitech.eu", "--window-size=800,600"]
    });
    const pages = await browser.pages();
    const page = pages[0];
    await saveCookies(base, "./cookies.json");
    await restoreCookies(page, "./cookies.json");
    await page.goto(url);
    await page.waitForRequest((res) => res.url().startsWith("https://my.epitech.eu/"), { timeout: 0 });
    await saveCookies(page, "./cookies.json");
    await restoreCookies(base, "./cookies.json");
    await browser.close();
}

async function refreshMyEpitechToken() {
    const loginBtnSelector = '[href^="https://login.microsoftonline.com/common/oauth2/authorize"]';
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await restoreCookies(page, "./cookies.json");
        await page.goto('https://my.epitech.eu');
        const loginButton = await page.$(loginBtnSelector);
        if (loginButton != null) {
            await page.click(loginBtnSelector);
            await new Promise((resolve) => setTimeout(resolve, 200));
            await page.waitForNetworkIdle();
            const url = page.mainFrame().url();
            if (url.startsWith("https://login.microsoftonline.com/")) {
                console.log("Asking for oauth...");
                await openMicrosoftWindow(page, url);
                await page.reload();
                await page.waitForNetworkIdle();
            } else {
                console.log("Auto-auth was successful");
            }
        } else {
            console.log("Already logged in");
        }
    } catch (ex) {
        await page.goto('https://my.epitech.eu');
        const loginButton = await page.$(loginBtnSelector);
        if (loginButton != null) {
            await browser.close();
            throw ex;
        }
    }
    const token = await page.evaluate(() => localStorage.getItem("argos-api.oidc-token"));
    await browser.close();
    if (typeof token !== "string")
        throw new Error("token not found");
    return token.substring(1, token.length - 1);
}

async function executeEpitestRequest(req: express.Request, token: string) {
    const res = await axios({
        baseURL: "https://api.epitest.eu/",
        url: req.path,
        params: req.params,
        headers: {
            "Authorization": "Bearer " + token,
            "Origin": "my.epitech.eu"
        }
    }).catch(e => e.response);

    return res;
}

(async () => {
    let myEpitechToken = await refreshMyEpitechToken();

    app.get("/", (req, res) => {
        res.send("the relay is working :D");
    });

    app.use("/epitest", async (req, res) => {
        try {
            let content = await executeEpitestRequest(req, myEpitechToken);
            if (content.status == 401) {
                myEpitechToken = await refreshMyEpitechToken();
                content = await executeEpitestRequest(req, myEpitechToken);
            }
            res.status(content.status).send(content.data);
        } catch (ex) {
            console.error(ex);
            res.status(500).send("Relay error.");
        }
    })

    const port = parseInt(process.env.PORT ?? "8080");
    const host = process.env.HOST ?? "127.0.0.1";

    app.listen(port, host, () => {
        console.log("Relay server started at http://" + host + ":" + port);
    });
})();