/* static file 응답하기  */
var mysql = require('mysql');
var dateFormat = require('dateformat');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var db = require('./nodeDb.js')

//express 모듈에 보조 장치 장착한다.
app.use(bodyParser.json()); // JSON 형식으로 넘어온 데이터 처리 
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('www'));
app.use(function (req, res, next) {

	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});

var pool  = mysql.createPool({
	connectionLimit : 10,
	host     : db.url,
	port	   : 3306,
	user     : db.username,
	password : db.password,
	database : 'reizen'
});

pool.on('connection', function() {
	console.log('커넥션 객체가 생성되었음.');
});

app.post('/user/checkMail.do', function (request, response) {
	pool.query(
			'SELECT mail FROM users WHERE mail=?',
			[request.body.email], 
			function(err, rows, fields) { 
				if (err) throw err;
				response.writeHead(200, {
					'Content-Type' : 'application/json;charset=UTF-8' 
				});
				var data = new Object();
				if (rows.length < 1) {
					data.status = 'success'
				} else {
					data.status = 'duplicated'
				}
				data = JSON.stringify(data);
				response.write(data);
				response.end();
			});
});

app.listen(7878, function () {
	console.log('Example app listening on port 7878!');
});