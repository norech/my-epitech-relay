import axios, { Method } from 'axios';
import express from "express";
import { refreshMyEpitechToken } from './get_token';
require('dotenv').config();
const app = express();

export async function executeBDDApiRequest(endpoint:string, params:string, method:Method, body:object) {
    const res = await axios({
        method: method,
        url: process.env.API_DB_HOST + endpoint + params,
        headers: {
            "Authorization": "Bearer " + process.env.API_DB_TOKEN,
        },
        data: body
    }).catch(e => e.response);
    if (res == undefined)
        return (false);
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
