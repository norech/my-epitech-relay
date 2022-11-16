require('dotenv').config();
import puppeteer from 'puppeteer';
import { restoreCookies, saveCookies, getCookiesFiles } from './cookies';
import { getUserIfCookiesStatusIs, changeUserCookiesStatus, getAllCookiesStatusOfUsers } from './bdd_lib';
import express, { json } from "express";
import axios from 'axios';
const app = express();

async function refreshMyEpitechToken(cookiesJSON: string) {
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
        await restoreCookies(page, cookiesJSON);
        await page.goto('https://my.epitech.eu');
        const loginButton = await page.$(loginBtnSelector);
        if (loginButton != null) {
            await page.click(loginBtnSelector);
            await new Promise((resolve) => setTimeout(resolve, 200));
            await page.waitForNetworkIdle();
            const url = page.mainFrame().url();
            if (url.startsWith("https://login.microsoftonline.com/")) {
                console.log("2.0");
                console.log("Oauth failed...");
                return ("token_error");
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

async function setRouteRelay(userInfo:any) {
    let myEpitechToken = await refreshMyEpitechToken(userInfo.cookies);

    app.use("/"+ userInfo.email + "/epitest", async (req, res) => {
        try {
            let content = await executeEpitestRequest(req, myEpitechToken);
            if (content.status == 401) {
                myEpitechToken = await refreshMyEpitechToken(userInfo.cookies);
                content = await executeEpitestRequest(req, myEpitechToken);
            }
            res.status(content.status).send(content.data);
        } catch (ex) {
            console.error(ex);
            res.status(500).send("Relay error.");
        }
    })
}

async function checkAndSetNewUsers() {
    await getUserIfCookiesStatusIs('wait', async function(userList:any) {
        for (var i = 0, len = Object.keys(userList).length; i < len; ++i) {
            var rsp = await refreshMyEpitechToken(userList[i].cookies);
            console.log("user email:", userList[i].email);
            console.log("return function:", rsp);
            if (rsp == "token_error") {
                await changeUserCookiesStatus(JSON.stringify(userList[i].id), 'expired');
            } else {
                await changeUserCookiesStatus(JSON.stringify(userList[i].id), 'ok');
                await setRouteRelay(userList[i]);
            }
        }
    });
    await getUserIfCookiesStatusIs('new', async function(userList:any) {
        for (var i = 0, len = Object.keys(userList).length; i < len; ++i) {
            var rsp = await refreshMyEpitechToken(userList[i].cookies);
            console.log("user email:", userList[i].email);
            console.log("return function:", rsp);
            if (rsp == "token_error") {
                await changeUserCookiesStatus(JSON.stringify(userList[i].id), 'expired');
            } else {
                await changeUserCookiesStatus(JSON.stringify(userList[i].id), 'ok');
                await setRouteRelay(userList[i]);
            }
        }
    });
}

(async () => {
    console.log("0");
    // await checkAndSetNewUsers();
    getUserIfCookiesStatusIs('ok', async function(userList:any) {
        for (var i = 0, len = Object.keys(userList).length; i < len; ++i) {
            await setRouteRelay(userList[i]);
        }
    });
    // getAllCookiesStatusOfUsers(async function(userList:any) {
    //     for (var i = 0, len = Object.keys(userList).length; i < len; ++i) {
    //         app.get("/" + userList[i].email + "/status", (req, res) => {
    //             console.log(userList[i].email)
    //             res.send(userList[i].email);
    //         });
    //     }
    // });
    const port = parseInt(process.env.PORT ?? "8080");
    const host = process.env.HOST ?? "127.0.0.1";
    app.listen(port, host, () => {
        console.log("Relay server started at http://" + host + ":" + port);
    });
})();
