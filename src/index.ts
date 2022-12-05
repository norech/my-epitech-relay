require('dotenv').config();
import {refreshMyEpitechToken} from './get_token';
import {executeEpitestRequest, executeBDDApiRequest} from './get_api';
import express from "express";
const app = express();

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
    });
}

async function checkAndSetNewUsers() {
    let rsp_wait = await executeBDDApiRequest("user/status/", "wait", 'GET', {});
    if (rsp_wait != false) {
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
    }
    let rsp_new = await executeBDDApiRequest("user/status/", "new", 'GET', {});
    if (rsp_new != false) {
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
}

const asyncFunction = (t:any) => new Promise(resolve => setTimeout(resolve, t));

async function infinitLoopForUserStatus() {
    while (true) {
        await checkAndSetNewUsers();
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
    for (var i = 0, len = userList.data.length; i < len; ++i) {
        await setRouteRelay(userList.data[i]);
    }
    infinitLoopForUserStatus();

    app.get("/", (req, res) => {
        res.send("the relay is working :D");
    });

    const port = parseInt(process.env.PORT_API ?? "8090");
    const host = process.env.HOST_API ?? "127.0.0.1";
    app.listen(port, host, () => {
        console.log("Relay server started at http://" + host + ":" + port);
    });
})();
