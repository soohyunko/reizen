/* static file 응답하기  */
var mysql = require('mysql');
var dateFormat = require('dateformat');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

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
  host     : '192.168.0.28',
  port	   : 3306,
  user     : 'reizen',
  password : '1234',
  database : 'reizen'
});

pool.on('connection', function() {
	console.log('커넥션 객체가 생성되었음.');
});

app.get('/scheduler/checkTime.do', function (request, response) {
	pool.query(
	  'select date_format(time, "%H:%i") time from routes where sdno=? and day=? and date_format(time, "%H:%i")=?',
	  [request.query.scheduleNo, request.query.day, request.query.time], 
	  function(err, rows, fields) { 
		  if (err) throw err;
		  response.writeHead(200, {
			'Content-Type' : 'application/json;charset=UTF-8' 
		  });
		  var data = new Object();
		  if(rows.length>0){
			  data.status='exist'
		  }else{
			  data.status='empty'
		  }
		  data = JSON.stringify(data);
		  response.write(data);
		  response.end();
	});
});

app.listen(8890, function () {
  console.log('Example app listening on port 8890!');
});
