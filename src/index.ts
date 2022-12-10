require('dotenv').config();
import {refreshMyEpitechToken} from './get_token';
import {executeEpitestRequest, executeBDDApiRequest} from './api';
import { checkNewUsers, checkWaitUsers } from './check_status';
import express from "express";
const app = express();

export async function setRouteRelay(userInfo:any) {
    let myEpitechToken = await refreshMyEpitechToken(userInfo['cookies']);
    app.use("/"+ userInfo['email'] + "/epitest", async (req, res) => {
        try {
            let content = await executeEpitestRequest(req, myEpitechToken);
            if (content.status == 401) {
                myEpitechToken = await refreshMyEpitechToken(userInfo['cookies']);
                if (myEpitechToken == "token_error") {
                    await executeBDDApiRequest("user/id/", JSON.stringify(userInfo['id']), 'PUT', {'cookies_status':'expired'})
                } else
                    content = await executeEpitestRequest(req, myEpitechToken);
            }
            res.status(content.status).send(content.data);
        } catch (ex) {
            console.error(ex);
            res.status(500).send("Relay error.");
        }
    });
}

const asyncFunction = (t:any) => new Promise(resolve => setTimeout(resolve, t));

async function infinitLoopForUserStatus() {
    while (true) {
        await checkWaitUsers();
        await checkNewUsers();
        await asyncFunction(60000);
    }
}

(async () => {
    const checkAPI = await executeBDDApiRequest("", "", 'GET', {});
    if (checkAPI == false)
        throw new Error("API not launch");
    const userList = await executeBDDApiRequest("user/status/", "ok", 'GET', {});
    if (userList == false)
        throw new Error("List of user not found");
    for (var i = 0, len = userList.data.length; i < len; ++i)
        await setRouteRelay(userList.data[i]);
    infinitLoopForUserStatus();
    app.get("/", (req, res) => {
        res.send("the relay is working :D");
    });
    const host:any = process.env.HOST_NAME;
    const port:any = process.env.PORT;
    app.listen(port, host, () => {
        console.log("Relay server started at http://" + host + ":" + port);
    });
})();
