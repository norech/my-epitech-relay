import fs from "fs";
import puppeteer from 'puppeteer';

export async function saveCookies(page: puppeteer.Page, cookiesPath: string) {
  const client = await page.target().createCDPSession();
  const cookies = (await client.send("Network.getAllCookies"))["cookies"];
  console.log("Writing cookies");
  fs.writeFileSync(cookiesPath, JSON.stringify(cookies));
}

export async function restoreCookies(page: puppeteer.Page, cookiesPath: string) {
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