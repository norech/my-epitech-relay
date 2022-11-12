require('dotenv').config();
import puppeteer from 'puppeteer';
import { restoreCookies, saveCookies, getCookiesFiles } from './cookies';
import express from "express";
import axios from 'axios';
const app = express();

async function refreshMyEpitechToken(filePath: string) {
    console.log("2");
    const loginBtnSelector = '[href^="https://login.microsoftonline.com/common/oauth2/authorize"]';
    const browser = await puppeteer.launch({
        executablePath: process.env.BROWSER_BINARY_PATH != ""
            ? process.env.BROWSER_BINARY_PATH : undefined,
        product: process.env.BROWSER_TYPE as "chrome" | "firefox",
        args: process.env.BROWSER_ARGS?.split(" ") ?? [],
        headless: true
    });
    

    const page = await browser.newPage();
    try {
        await restoreCookies(page, filePath);
        await page.goto('https://my.epitech.eu');
        const loginButton = await page.$(loginBtnSelector);
        if (loginButton != null) {
            await page.click(loginBtnSelector);
            await new Promise((resolve) => setTimeout(resolve, 200));
            await page.waitForNetworkIdle();
            const url = page.mainFrame().url();
            if (url.startsWith("https://login.microsoftonline.com/")) {
                console.log("2.0");
                console.log("Asking for oauth...");
                // await openMicrosoftWindow(page, url);
                await page.reload();
                await page.waitForNetworkIdle();
                console.log("2.1");
            } else {
                console.log("Auto-auth was successful");
            }
            console.log("2.2");
        } else {
            console.log("Already logged in");
        }
    } catch (ex) {
        console.log("2.3");
        await page.goto('https://my.epitech.eu');
        const loginButton = await page.$(loginBtnSelector);
        if (loginButton != null) {
            await browser.close();
            throw ex;
        }
    }
    console.log("2.4");
    const token = await page.evaluate(() => localStorage.getItem("argos-api.oidc-token"));
    await browser.close();
    if (typeof token !== "string")
        throw new Error("token not found");
    return token.substring(1, token.length - 1);
}

async function executeEpitestRequest(req: express.Request, token: string) {
    console.log("1");
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
    console.log("0");
    const pathDir = './cookies_bd/';
    var fileList:Array<String> = await getCookiesFiles(pathDir);
    console.log(fileList.length);
    
    for (var i = 0; i < fileList.length; ++i) {
        const fileName = fileList[i].replace(".json", '');
        const filePath = pathDir + fileList[i];
        console.log(fileList[i], fileName, filePath);

        let myEpitechToken = await refreshMyEpitechToken(filePath);
        app.get("/" + fileName + "/", (req, res) => {
            res.send("the relay is working :D");
        });

        app.use("/"+ fileName + "/epitest", async (req, res) => {
            try {
                let content = await executeEpitestRequest(req, myEpitechToken);
                if (content.status == 401) {
                    myEpitechToken = await refreshMyEpitechToken(filePath);
                    content = await executeEpitestRequest(req, myEpitechToken);
                }
                res.status(content.status).send(content.data);
            } catch (ex) {
                console.error(ex);
                res.status(500).send("Relay error.");
            }
        })
    }
    const port = parseInt(process.env.PORT ?? "8080");
    const host = process.env.HOST ?? "127.0.0.1";

    app.listen(port, host, () => {
        console.log("Relay server started at http://" + host + ":" + port);
    });
})();
