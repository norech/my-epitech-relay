require('dotenv').config();
import {setRouteRelay, checkAndSetNewUsers, executeBDDApiRequest} from './get_info';
import express from "express";
const app = express();

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
