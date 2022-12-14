require('dotenv').config();
import {refreshMyEpitechToken} from './get_token';
import {executeEpitestRequest, executeBDDApiRequest} from './api';
import { checkStatusUsers } from './check_status';
import express from "express";
const app = express();

function removeRouteFromEmail(email:string) {
    app._router.stack.forEach((route:any, i:number, routes:any) => {
        if (route.route?.path && route.route?.path.includes(email))
            routes.splice(i, 1);
    });
}

export async function setRouteRelay(userInfo:any) {
    let myEpitechToken = await refreshMyEpitechToken(userInfo['cookies']);
    app.get("/" + userInfo['email'] + "/epitest/me/:year", async (req, res) => {
        try {
            let content = await executeEpitestRequest(req, myEpitechToken);
            if (content.status == 401) {
                myEpitechToken = await refreshMyEpitechToken(userInfo['cookies']);
                if (myEpitechToken == "token_error") {
                    await executeBDDApiRequest("user/id/", JSON.stringify(userInfo['id']), 'PUT', {'cookies_status':'expired'})
                    res.status(410).send({ message: "Cookies just expired" });
                    removeRouteFromEmail(userInfo.email);
                    return;
                } else
                    content = await executeEpitestRequest(req, myEpitechToken);
            }
            res.status(content.status).send(content.data);
        } catch (error) {
            console.error(error);
            res.status(500).send("Relay error");
        }
    });
}

async function accountRoute() {
    app.get("/account/delete/:email", async (req, res) => {
        try {
            const email = req.params.email;
            if (email !== undefined) { //TODO if email is not exist
                removeRouteFromEmail(email);
                res.status(200).send({ message: "Route delete" });
            } else
                res.status(400).send({ message: "Bad argument" });
        } catch (error) {
            console.error(error);
            res.status(500).send("Relay error");
        }
    });
}

const asyncSleep = (t:any) => new Promise(resolve => setTimeout(resolve, t));

async function infinitLoopForUserStatus() {
    while (true) {
        await checkStatusUsers("wait");
        await checkStatusUsers("new");
        await asyncSleep(60000);
    }
}

(async () => {
    const checkAPI = await executeBDDApiRequest("", "", 'GET', {});
    if (checkAPI == false)
        throw new Error("API not launched");
    const userList = await executeBDDApiRequest("user/status/", "ok", 'GET', {});
    if (userList == false)
    throw new Error("List of user not found");
    for (var i = 0, len = userList.data.length; i < len; ++i)
        await setRouteRelay(userList.data[i]);
    await accountRoute();
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
