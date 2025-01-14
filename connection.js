var mysql = require("mysql");
var util = require("util");

var conn = mysql.createConnection({
    "host":"b8n1rh8fy2ujm9fobkqs-mysql.services.clever-cloud.com",
    "user":"us7k4g1tl71cmwlb",
    "password":"yNySfdZedmNRpaNbXaX5",
    "database":"b8n1rh8fy2ujm9fobkqs"
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = exe;