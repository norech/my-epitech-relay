import { ListFormat } from "typescript";

var mysql = require('mysql');

var bdd_connect = mysql.createConnection({
  host: "localhost",
  user: "RELAY",
  password: 'password-relay',
  database: "moulibot"
});

export async function getUserIfCookiesStatusIs(status:string, callback:CallableFunction) {
    bdd_connect.connect(function(err:Error) {
        if (err) throw err;
        bdd_connect.query("SELECT id,email,cookies_status,cookies FROM user WHERE cookies_status = ?", status, function (err:Error, result:object, fields:object) {
            if (err) throw err;
            return callback(JSON.parse(JSON.stringify(result)));
        });
        bdd_connect.end();
    });
}
