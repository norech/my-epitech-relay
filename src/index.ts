require('dotenv').config();
import puppeteer, { TimeoutSettings } from 'puppeteer';
import { restoreCookies } from './cookies';
import express, { json } from "express";
import axios, { Method } from 'axios';
const app = express();

async function refreshMyEpitechToken(cookiesJSON: string) {
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

async function setRouteRelay(userInfo:any) {
    let myEpitechToken = await refreshMyEpitechToken(userInfo['cookies']);

    app.use("/"+ userInfo['email'] + "/epitest", async (req, res) => {
        try {
            let content = await executeEpitestRequest(req, myEpitechToken);
            if (content.status == 401) {
                myEpitechToken = await refreshMyEpitechToken(userInfo['cookies']);
                content = await executeEpitestRequest(req, myEpitechToken);
            }
            res.status(content.status).send(content.data);
        } catch (ex) {
            console.error(ex);
            res.status(500).send("Relay error.");
        }
    })
}

async function executeBDDApiRequest(endpoint:string, params:string, method:Method, body:object) {
    const res = await axios({
        method: method,
        url: "http://127.0.0.1:3000/" + endpoint + params,
        headers: {
            "Authorization": "Bearer " + "veuxarisassherkzbdbd",
        },
        data: body
    }).catch(e => e.response);
    return res;
}

async function checkAndSetNewUsers() {
    let rsp_wait = await executeBDDApiRequest("user/status/", "wait", 'GET', {});
    let userList_wait = rsp_wait.data;
    for (var i = 0, len = userList_wait.length; i < len; ++i) {
        var rsp = await refreshMyEpitechToken(userList_wait[i]['cookies']);
        if (rsp == "token_error") {
            await executeBDDApiRequest("user/id/", JSON.stringify(userList_wait[i]['id']), 'PUT', {'cookies_status':'expired'})
        } else {
            await executeBDDApiRequest("user/id/", JSON.stringify(userList_wait[i]['id']), 'PUT', {'cookies_status':'ok'})
            await setRouteRelay(userList_wait[i]);
        }
    }
    let rsp_new = await executeBDDApiRequest("user/status/", "new", 'GET', {});
    let userList_new = rsp_new.data;
    for (var i = 0, len = userList_new.length; i < len; ++i) {
        var rsp = await refreshMyEpitechToken(userList_new[i]['cookies']);
        if (rsp == "token_error") {
            await executeBDDApiRequest("user/id/", JSON.stringify(userList_new[i]['id']), 'PUT', {'cookies_status':'expired'})
        } else {
            await executeBDDApiRequest("user/id/", JSON.stringify(userList_new[i]['id']), 'PUT', {'cookies_status':'ok'})
            await setRouteRelay(userList_new[i]);
        }
    }
}

const asyncFunction = (t:any) => new Promise(resolve => setTimeout(resolve, t));

async function infinitLoopForUserStatus() {
    while (true) {
        await checkAndSetNewUsers();
        await asyncFunction(60000);
    }
}

(async () => {
    const userList = await executeBDDApiRequest("user/status/", "ok", 'GET', {});
    for (var i = 0, len = userList.data.length; i < len; ++i) {
        await setRouteRelay(userList.data[i]);
    }
    infinitLoopForUserStatus();
    const port = parseInt(process.env.PORT_API ?? "8080");
    const host = process.env.HOST_API ?? "127.0.0.1";
    app.listen(port, host, () => {
        console.log("Relay server started at http://" + host + ":" + port);
    });
})();
