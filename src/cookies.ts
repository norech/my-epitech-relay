import puppeteer from 'puppeteer';

export async function restoreCookies(page: puppeteer.Page, cookiesJSON: string) {
    try {
        let cookies = JSON.parse(cookiesJSON.toString());
        console.log("Restoring cookies");
        await page.setCookie(...cookies);
    } catch (err) {
        console.error("Can't restore cookies", err);
    }
}
