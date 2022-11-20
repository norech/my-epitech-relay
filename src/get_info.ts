import axios, { Method } from 'axios';
import express from "express";
import {refreshMyEpitechToken} from './token';
const app = express();

export async function executeBDDApiRequest(endpoint:string, params:string, method:Method, body:object) {
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

export async function executeEpitestRequest(req: express.Request, token: string) {
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

export async function setRouteRelay(userInfo:any) {
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

export async function checkAndSetNewUsers() {
    let rsp_wait = await executeBDDApiRequest("user/status/", "wait", 'GET', {});
    let userList_wait = rsp_wait.data;
    let rsp_new = await executeBDDApiRequest("user/status/", "new", 'GET', {});
    let userList_new = rsp_new.data;

    for (var i = 0, len = userList_wait.length; i < len; ++i) {
        var rsp = await refreshMyEpitechToken(userList_wait[i]['cookies']);
        if (rsp == "token_error") {
            await executeBDDApiRequest("user/id/", JSON.stringify(userList_wait[i]['id']), 'PUT', {'cookies_status':'expired'})
        } else {
            await executeBDDApiRequest("user/id/", JSON.stringify(userList_wait[i]['id']), 'PUT', {'cookies_status':'ok'})
            await setRouteRelay(userList_wait[i]);
        }
    }
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