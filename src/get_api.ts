import axios, { Method } from 'axios';
import express from "express";
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
