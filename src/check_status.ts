import { refreshMyEpitechToken } from './get_token';
import { setRouteRelay, executeBDDApiRequest } from './api';

export async function checkWaitUsers() {
    let rspList = await executeBDDApiRequest("user/status/", "wait", 'GET', {});
    if (rspList != false) {
        let userLis = rspList.data;
        for (var i = 0, len = userLis.length; i < len; ++i) {
            var content = await refreshMyEpitechToken(userLis[i]['cookies']);
            if (content == "token_error") {
                await executeBDDApiRequest("user/id/", JSON.stringify(userLis[i]['id']), 'PUT', {'cookies_status':'expired'})
            } else {
                await executeBDDApiRequest("user/id/", JSON.stringify(userLis[i]['id']), 'PUT', {'cookies_status':'ok'})
                await setRouteRelay(userLis[i]);
            }
        }
    }
}

export async function checkNewUsers() {
    let rspList = await executeBDDApiRequest("user/status/", "new", 'GET', {});
    if (rspList != false) {
        let userList = rspList.data;
        for (var i = 0, len = userList.length; i < len; ++i) {
            var content = await refreshMyEpitechToken(userList[i]['cookies']);
            if (content == "token_error") {
                await executeBDDApiRequest("user/id/", JSON.stringify(userList[i]['id']), 'PUT', {'cookies_status':'expired'})
            } else {
                await executeBDDApiRequest("user/id/", JSON.stringify(userList[i]['id']), 'PUT', {'cookies_status':'ok'})
                await setRouteRelay(userList[i]);
            }
        }
    }
}

