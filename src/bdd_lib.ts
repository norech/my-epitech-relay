import { ListFormat } from "typescript";

var mysql = require('mysql');

var bdd_connect = mysql.createConnection({
  host: "localhost",
  user: "RELAY",
  password: 'password-relay',
  database: "moulibot"
});

export async function getUserIfCookiesStatusIs(status:string, callback:CallableFunction) {
    const sql = "SELECT id,email,cookies_status,cookies FROM user WHERE cookies_status ='" + status + "'";
    bdd_connect.connect(function(err:Error) {
        if (err) throw err;
        bdd_connect.query(sql, function (err:Error, result:object, fields:object) {
            if (err) throw err;
            return callback(JSON.parse(JSON.stringify(result)));
        });
        bdd_connect.end();
    });
}

export async function changeUserCookiesStatus(userId:string, status:string) {
	const sql = "UPDATE user SET cookies_status='" + status + "' WHERE id='" + userId + "'";
    bdd_connect.connect(function(err:Error) {
        if (err) throw err;
        bdd_connect.query(sql, function (err:Error, result:object, fields:object) {
            if (err) throw err;
        });
        bdd_connect.end();
    });
}
