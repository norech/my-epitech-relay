import fs from "fs";
import puppeteer from 'puppeteer';
import path_req from 'path';

export async function saveCookies(page: puppeteer.Page, cookiesPath: string) {
    console.log("3");
    const client = await page.target().createCDPSession();
    const cookies = (await client.send("Network.getAllCookies"))["cookies"];
    console.log("Writing cookies");
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies));
}

export async function restoreCookies(page: puppeteer.Page, cookiesPath: string) {
    console.log("4");
    if (!fs.existsSync(cookiesPath)) {
        console.log("No cookies to restore.");
        return;
    }
    try {
        let buf = fs.readFileSync(cookiesPath);
        let cookies = JSON.parse(buf.toString());
        console.log("Restoring cookies");
        await page.setCookie(...cookies);
    } catch (err) {
        console.error("Can't restore cookies", err);
    }
}

export async function getCookiesFiles(path:string):Promise<Array<String>> {
    var filenames = fs.readdirSync(path);
    const jsonFiles = filenames.filter(function (file) {
        return path_req.extname(file) === ".json";
      });
    return (jsonFiles);
}
