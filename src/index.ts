import { executeBDDApiRequest, setRouteRelay } from './api';
import { checkWaitUsers, checkNewUsers } from './check_status';
import express from "express";
require('dotenv').config();
const app = express();

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
