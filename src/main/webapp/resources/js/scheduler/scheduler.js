var $radio1;
var $radio2;
var $citySelect;
var scheduleNo = 0;
var total = 1;	// DB에서 가져온 전체 day 수
var contentId;
var date;
var day = 1;
var page = 1;
var category;
var eventDate;
var title;
var routeSeq;
var routeMap;
var spotPath;
var marker = [];
var routeData;

var emptySchedule = true;
var typeId='';
$(function() {
	$(window).unload(function () { // 윈도우 벗어날때 스케줄 넘버 삭제
			if(emptySchedule){ // 스케줄이 없다면 
				deleteScheduleAjax(scheduleNo);
			}else{ // 스케줄이 있다면
				var today = new Date();
				var year = today.getFullYear();
				var month = ((today.getMonth()+1) < 10 ? '0' : '')+(today.getMonth()+1); 
				var day = (today.getDate() < 10 ? '0' : '')+today.getDate(); 
				today = year+'-'+month+'-'+day;
				if(eventDate == today){
					var scheduleList = [];
					var scn = JSON.parse(sessionStorage.getItem('activeScheduleNo'));
					for(var i in scn){
						scheduleList.push(scn[i]);
					}
					scheduleList.push({
						scheduleNo : scheduleNo,
						title : title
					});
					sessionStorage.setItem('activeScheduleNo', JSON.stringify(scheduleList));
					sessionCheck();
				}//if
			}//else
	});//unload
	$(document).on('mouseenter', 'li.dayEvents', function(){
//		$(this).append('<i class="fa fa-cutlery"></i>');
	});
	for(var i=0; i<24; i++){ // 00시 ~ 23시30분 까지 지원 *db가 24시를 거부합니다.
		if(i<10){
			$('.updateHour').append('<option value='+'0'+i+'>'+'0'+i+'</option>');
			continue;
		}
		$('.updateHour').append('<option value='+i+'>'+i+'</option>');
	}
	/* 일정 새로 만들 때 */
	if(location.href.indexOf('=')==-1){
		$('#updateDay').modal({
			backdrop : "static",
			keyboard  : false
		});
		$('div#scheduleWrap').addClass('wrapUp');
		$('article#progress').addClass('progressUp');
	}
	/* 스케줄  추가했을 때 */
	else if(location.href.indexOf('scheduleNo')!=-1){
		scheduleNo=(location.href.substr(location.href.lastIndexOf('=') + 1)).replace("#","");
		$.getJSON('http://reizen.com:8889/scheduler/checkDay.do?scheduleNo='+scheduleNo, function(result){
			console.log(result);
			$day.attr('data-date', result[0].time);
		});

		listAjax(scheduleNo, 1);
		var user = sessionStorage.getItem('userNo');
		if( user ){ // 로그인 체크
			$.ajax({
				url : reizenUrl+'scheduler/scCheck.do?sc='+scheduleNo,
				method : 'GET',
				dataType: 'json',
				success : function(result){
					if(result.status=='success'){
						if(result.pass=='false'){ // 권한 없음
							swal("Access Denied", "You do not have permission", "warning"); 
							setTimeout(function(){ // 3초뒤 자동 이동
								window.location.href='main.html';
							},3000);
							
						}else if(result.pass=='right'){ // 성공
							var $day = $('#daysInfo');
							
							$day.attr('data-day', 1);
							$day.text('DAY'+day);
							
							$.getJSON('http://reizen.com:8889/scheduler/checkDay.do?scheduleNo='+scheduleNo, function(result){
								$day.attr('data-date', result[0].time);
								date=result[0].time;
								title=result[0].title;
								console.log(date,title);
							});
							listAjax(scheduleNo, 1);
						}
					}else{ // 세션에 데이터가 없을때
						swal("세션 만료", "세션이 만료되었습니다. 다시 로그인 해 주세요.", "warning"); 
						setTimeout(function(){ // 3초뒤 자동 이동
							window.location.href='main.html';
						},3000);
					}
				}, error  : function(){
					alert('ajax error');
				}
			});
		}else { // 비로그인 상태 
			swal("Access Denied", "You do not have permission , Please Login", "warning"); 
			$('body').hide();
			setTimeout(function(){ // 3초뒤 자동 이동
				window.location.href='main.html';
			},3000);
		}
	}
	/* 장소 추가했을 때 */
	else if(location.href.indexOf('cid')!=-1){
		$('#updateDay').modal({
			backdrop : "static",
			keyboard  : false
		});
		contentId = (location.href.substr(location.href.lastIndexOf('=') + 1)).replace("#","");
		$('#updateDay').on('hide.bs.modal', function (){
			$('#updateTime').modal('show');
			$('#btnTimeSubmit').off('click').on('click', function(){
				var hour = $('#updateTime input:first').val();
				if( hour >= 1 && hour <= 24 ){
					if( this.id=='btnTimeSubmit'){
						var min = $('#updateMin').val();
						var time = hour+":"+min;

						updateTime();		

						addAjax(contentId, date, day, time, scheduleNo);
						getTotal(scheduleNo);
						return;

					} // btntimeSubmit check
				}	//hour check if
			});	// btn click
		});
	}
	/* 스케줄 복사 추가했을 때 */
	else if(location.href.indexOf('copyScheduleNo')!=-1){
		scheduleNo = $(location).attr('search').substring(16);
		var copyScheduleNo=scheduleNo;
		$('#updateDay').modal({
			backdrop : "static",
			keyboard  : false
		});
		$('#updateDay').on('hidden.bs.modal', function(){
			$.getJSON(reizenUrl+'scheduler/copySchedule.do?scheduleNo='+scheduleNo+'&copyScheduleNo='+copyScheduleNo, function(response){
				if(response.status=='success'){
					console.log('일정 복사 성공');
					window.location.href='scheduler.html?scheduleNo='+scheduleNo;
				}
			});
		});
	} 

	/**	날짜 처리 		**/
	$( "#datepicker" ).datepicker({
		showOtherMonths: true,
		selectOtherMonths: true,
		dateFormat: "yy-mm-dd"
	});

	/**		검색 조건 처리 		**/
	$radio1 = $('#inlineRadio1');
	$radio2 = $('#inlineRadio2');
	$citySelect = $('#citySelect');

	$radio1.off('click').on('click', function(event){
		$radio1.attr('checked', true);
		$radio2.attr('checked', false);
		$citySelect.attr('disabled', true);
	});
	$radio2.off('click').on('click', function(event){
		$radio1.attr('checked', false);
		$radio2.attr('checked', true);
		$citySelect.attr('disabled', false);
	});

	/**	왼쪽 리스트 처리 	**/
	$( "#sortable" ).sortable({
		revert: true,
		containment : "#sortable",
		update : function(event, ui) {
			if(ui.item.hasClass('dropped')){
				$('#updateTime').modal('show');
				$('#btnTimeSubmit').off('click').on('click', function(){
					var hour = $('#updateHour option:selected').val()
					if( hour >= 0 && hour <= 24 ){ // 시간 검증
						var min = $('#updateMin option:selected').val();
						var time = hour+":"+min;
						ui.item.find('span.scheduleTime').text(time);

						contentId = ui.item.attr('data-contentid');
						date = $('#daysInfo').attr('data-date');
						day = $('#daysInfo').attr('data-day');

						updateTime();		

						return;
					}else{
						swal({
							 title: "잘못된 시간입니다.",   
							 text: "시간을 다시 입력해주세요.",   
							 type: "error",   
							 showCancelButton: false,   
							 confirmButtonColor: "#DD6B55",   
							 confirmButtonText: "확인",   
							 closeOnConfirm: true, 
							 function(){
								 $('#selectTime').modal('show');
							 }
						});
					}
				});	// btn click
			}else if(!ui.item.hasClass('dropped')) {
				ui.item.addClass('dropped');
				
				$('#selectTime').modal('show');
				$('#s-btnTimeSubmit').off('click').on('click', function(){
					var hour = $('#s-updateHour option:selected').val()

					if ( hour >= 0 && hour <= 24){
						var min = $('#s-updateMin option:selected').val();
						var time = hour+":"+min;
//							ui.helper.find('span.time').text(time);
						contentId = ui.item.attr('data-contentid');
						date = $('#daysInfo').attr('data-date');
						day = $('#daysInfo').attr('data-day');

						addAjax(contentId, date, day, time, scheduleNo);
						$('div#scheduleWrap').removeClass('wrapUp').addClass('wrapDown');
						$('article#progress').removeClass('progressUp').addClass('progressDown');
						return;
					}else{
						swal({
							 title: "잘못된 시간입니다.",   
							 text: "시간을 다시 입력해주세요.",   
							 type: "error",   
							 showCancelButton: false,   
							 confirmButtonColor: "#DD6B55",   
							 confirmButtonText: "확인",   
							 closeOnConfirm: true, 
							 function(){
								 $('#selectTime').modal('show')
							 }
						});
					}
				});
				$('.adm-cancel').on('click', function(){
					ui.item.remove();
				});
			}	// check class dropped
		}	// update 

	});	 // sortable

	doDrag();
	
	// 일단 테스트 경로 최적화
	$('#routeRefresh').on('click',function(){
		$('#bestRoute').modal('show');
	})

	var routeSource = $('#routeSelector').text();
	var routeTemplate = Handlebars.compile(routeSource);
	$('#bestRoute').on('shown.bs.modal', function(){ 
		h = $('.bestRouteDiv').height();
		$('#routeMap').height(h);
		bestRouteMap('routeMap');
		var list = new Object();
		list.list = routeData;
		$('.dropStart').empty().append(routeTemplate(list));
		$('.dropEnd').empty().append(routeTemplate(list));
	});
	
	$(document).on('click','.dropStart a',function(){
		if ($(this).attr('data-index') == $('.btnEnd').attr('data-end')) {
			swal("시작지점과 종료지점이 같을 수 없습니다.");
			return;
		}
		$('.btnStart').text($(this).text())
		$('.btnStart').attr('data-start',$(this).attr('data-index'));
	})
	
	$(document).on('click','.dropEnd a',function(){
		if ($('.btnStart').attr('data-start') == $(this).attr('data-index')) {
			swal("시작지점과 종료지점이 같을 수 없습니다.");
			return;
		}
		$('.btnEnd').text($(this).text())
		$('.btnEnd').attr('data-end',$(this).attr('data-index'));
	})
	
	var test = true;
	$(document).on('click','#btnActive',function(){
		if ($('.btnStart').attr('data-start') == null && $('.btnEnd').attr('data-end') == null) {
			swal("시작 & 도착 장소를 선택해주세요.")
			return;
		}
		dataTheorem();
		bestRoute();
	})
	
	$(document).on('click','#btnRotueSubmit',function(){
		bestRouteUpdate();
	})
});	 // jquery 


$('#searchBar').on('keydown', function(event){
	if( event.keyCode == 13 ){
		$('#draggable').empty();
		searchAjax();
	}
});	// searchBar

$('#btnSearch').off('click').on('click', function(){
	$('#draggable').empty();
	searchAjax();
});	// btnSearch

$('#btnAdd').off('click').on('click', function(){
	date = $('#daysInfo').attr('data-date');

	var addDay = new Date(date);

	addDay.setDate(addDay.getDate()+1);	
	date = addDay.getFullYear()+'-'+(addDay.getMonth()+1)+'-'+addDay.getDate();
	$('#daysInfo').attr('data-date', date);
	day++;
	$('#daysInfo').attr('data-day', day);
	$('#daysInfo').text('DAY'+day);

	console.log('추가 할 : '+scheduleNo+', '+day);
	updateDayList('add', scheduleNo, day);

	console.log('리스트보여줄  : '+scheduleNo+', '+day);
	listAjax(scheduleNo, day);
	total++;
	console.log('total : '+total);
});	// btnAdd

$('#btnDelete').off('click').on('click', function(){
	if( day == 1 ){
		sweetAlert("INFO","삭제할 데이터가 없어요 :( ","info");
		return;
	}
	console.log('삭제 할 : '+scheduleNo+', '+day);
	deleteDayAjax(scheduleNo, day);
	updateDayList('min', scheduleNo, day);
	date = $('#daysInfo').attr('data-date');

	var addDay = new Date(date);

	addDay.setDate(addDay.getDate()-1);	
	date = addDay.getFullYear()+'-'+(addDay.getMonth()+1)+'-'+addDay.getDate();
	$('#daysInfo').attr('data-date', date);
	day--;
	$('#daysInfo').attr('data-day', day);
	$('#daysInfo').text('DAY'+day);

	console.log('리스트보여줄  : '+scheduleNo+', '+day);
	listAjax(scheduleNo, day);
	total--;
	console.log('total : '+total);
});	// btnDelete

$('#btnPrev').off('click').on('click', function(){
	if( day == 1 ){
		return;
	}
	date = $('#daysInfo').attr('data-date');
	var addDay = new Date(date);
	addDay.setDate(addDay.getDate()-1);	
	date = addDay.getFullYear()+'-'+(addDay.getMonth()+1)+'-'+addDay.getDate();
	$('#daysInfo').attr('data-date', date);
	day--;
	$('#daysInfo').attr('data-day', day);
	$('#daysInfo').text('DAY'+day);
	listAjax(scheduleNo, day);
});	// btnPrev

$('#btnNext').off('click').on('click', function(){
	if( day == total ){
		sweetAlert("INFO","day 추가 버튼을 눌러 일정을 추가해주세요!","info");
		return;
	}
	
	date = $('#daysInfo').attr('data-date');
	var addDay = new Date(date);
	addDay.setDate(addDay.getDate()+1);	
	date = addDay.getFullYear()+'-'+(addDay.getMonth()+1)+'-'+addDay.getDate();
	$('#daysInfo').attr('data-date', date);
	day++;
	$('#daysInfo').attr('data-day', day);
	$('#daysInfo').text('DAY'+day);
	listAjax(scheduleNo, day);
});	// btnNext

$('#btnDaySubmit').on('click', function(){
	date = $('#datepicker').val();

	eventDate = date;

	var $day = $('#daysInfo');
	$day.attr('data-date', date);
	$day.attr('data-day', 1);
	$day.text('DAY'+day);

	addScheduleAjax(eventDate);
});

/**	오른쪽 검색창 드래그 처리 	**/
function doDrag(){
	$("#draggable li").draggable({
		connectToSortable: "#sortable",
		helper: 
			function() {
			var title = $(this).find('h3').text();
			var id = $(this).data('contentid');
			return  $('<li class="dayEventsMoving" data-contentid="'+id+'">'
					+'<div class="contents">'
					+'<h3><i class="fa fa-camera" aria-hidden"true"></i></h3>'
					+'<h2>'+title+'</h2>'
					+'</div>'
					+'<div class="icon">'
					+'<a class="removeBtn"><i class="fa fa-close" aria-hidden="true"></i></a>'
					+'</div>'
					+'</li>');
		},
		revert: "invalid"
	});
}	// doDrag()


function updateTime(){
	var $time = $('#sortable li span.scheduleTime');
	var data=[];
	var times;
	var routeNo;

	for(var i=0; i<$time.length; i++){
		times = $time.eq(i).text();
		routeNo = $('#sortable > li').eq(i).attr('data-routeno');
		console.log(times+", "+routeNo);
		data.push({
			time : times,
			routeNo : routeNo
		});
	}
	indexAjax(data);
}


$('.searchIcon').not('#btnLocation').off('click').on('click', function(){
	$('#searchInput').val('');
	category=$(this).attr('data-cate');
	$('#draggable').empty();
	page = 1;
	searchAjax();
});

$('#draggable').scroll(function(){
	var scrolltop = parseInt($('#draggable').scrollTop());
	var scrollWhere =$('#draggable')[0].scrollHeight-parseInt($('#draggable').css('height').replace('px',''));
	if( $(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight ){
		page ++;
		searchAjax();
	}
});

$('#sortable').on('click', 'a.removeBtn', function(event){
	event.preventDefault();
	var routeNo = $(this).parent().parent('li').data('routeno');
	swal({
		 title: "Are you sure?",   
		 text: "You will not be able to recover this imaginary file!",   
		 type: "warning",   
		 showCancelButton: true,   
		 confirmButtonColor: "#DD6B55",   
		 confirmButtonText: "Yes, delete it!",   
		 closeOnConfirm: false}, 
		 function(){
			 removeRouteAjax(routeNo)
			 listAjax(scheduleNo, day);
		 });
});
$('#sortable').on('click', 'a.editBtn', function(event){ // 수정 버튼 이벤트 리스너
	event.preventDefault();
	var routeNo= $(this).parents('li').data('routeno');
	$.getJSON('http://reizen.com:8889/scheduler/checkDay.do?scheduleNo='+scheduleNo, function(result){
		if(result.length>0){ // day가 있다면 ....? day가 없는 일정이 있을 수 있나 ?
			var daySource = $('#dayList').html();
			var dayTemplate = Handlebars.compile(daySource);
			$('.adm-formMargin option').not('option.default').remove(); // day select 지움
			$('.adm-form-group').hide();
			$('.adm-formMargin').append(dayTemplate(result));
			$('#dayMove').modal('show');
			$('#btnMoveDayConfirm').attr('data-routeNo',routeNo);
		}else { //day가 없다면 .... 인데 ... day가 없는 일정이 있을 수 없으니까 .. 에러...
			swal("Failed!", "일정 조회 실패. 관리자에게 문의하세요. ", "error"); 
		}
	});
});
$(document).on('change','.adm-formMargin', function(){ // day가 변경되면 발생하는 이벤트
	if($(this).data('day')==null){ // 날짜를 선택해주세요 선택시  
		$('.adm-form-group').fadeOut();
	}
	$('.adm-form-group').fadeIn();
});
$(document).on('change','.m-updateHour,.m-updateMin',function(){
	$.getJSON('http://reizen.com:8890/scheduler/checkTime.do?scheduleNo='+scheduleNo+'&day='+day+'&time='+time, function(result){
		if(result.status=='exist'){
			$('.control-label').remove();
			$('div.form-group').append('<label class="control-label" for="inputError1">중복된 시간입니다.</label>');
			$('div.form-group').addClass('has-error');
		} else {
			$('.control-label').remove();
			$('div.form-group').removeClass('has-error');
		} //else
	});
})
$('#btnMoveDayConfirm').on('click',function(){ // 일정 변경 확인버튼
	event.preventDefault();
	var time = $('#m-updateHour option:selected').val()+':'+$('#m-updateMin option:selected').val();
	var date = $('.adm-formMargin option:selected').val();
	var day = $('.adm-formMargin option:selected').data('day');
	var routeNo=$(this).data('routeno');
	console.log(time,date,day,contentId,routeNo);
	if(time==null || date ==null || day==null){ // 입력값 검증 
		swal("Failed!", "모든 정보를 기입해 주세요", "error"); 
		return;
	}
	if(!$('div.form-group').hasClass('has-error')){
		updateAjax(routeNo,date,day,time,scheduleNo);
	}
})
/********   스크랩 장소 보기   ********/
$('#btnLocation').off('click').on('click', function(){
	$.getJSON(reizenUrl+'location/scrapSpotList.do', function(response){
		if(response.status=='success'){
			console.log(response.data);
			if( response.data[0] != null ){
				var source = $('#searchResult').text();
				var template = Handlebars.compile(source);
				var resultset = template(response);

				var draggable = $('#draggable'); 

				draggable.empty();
				draggable.append(resultset);
				doDrag();
				
			}else {
				return;
			}
		}
	});
});



/**		map 		**/

function initMap(){
	var map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 37.5652894, lng: 126.8494669},
		disableDefaultUI: true,
		zoom: 8
	});
}

$(document).on('click', '.mapBtn', function(event){
	var $li = $(this).parents('li');
	var 	mapX = parseFloat($li.data('mapx')),
			mapY = parseFloat($li.data('mapy'));
	aroundSearch(mapX,mapY);
});

function pointMap(mapX, mapY,maps) {

	var myLatLng = {
			lat : mapY,
			lng : mapX
	};

	var map = new google.maps.Map(document.getElementById('map'), {
		zoom : 15,
		center : myLatLng,
		disableDefaultUI: true
	});

	var marker = new google.maps.Marker({
		position : myLatLng,
		map : map,
		title : 'Hello World!'
	});
	if(maps.length>0){
		maps.forEach(function(value,key){
			var marker = new google.maps.Marker({
				position: {lat: value.lat, lng: value.lng},
				map: map
			});
		})
	}

}

$('#btnRoute').on('click', function(){
	routeMap('map');
});

function routeMap(){

	var $list = $('#sortable li');
	var spots = [];
	
	if($list.length==0){
		var map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 37.5652894, lng: 126.8494669},
			disableDefaultUI: true,
			zoom: 8
		});
		return;
	}else if($list.length==1){
		var mapX = parseFloat($list.first().data('mapx'));
		var mapY = parseFloat($list.first().data('mapy'));
		var myLatLng = {
				lat : mapY,
				lng : mapX
		};
		var map = new google.maps.Map(document.getElementById('map'), {
			zoom : 15,
			center : myLatLng,
			disableDefaultUI: true
		});

		var marker = new google.maps.Marker({
			position : myLatLng,
			map : map,
			title : 'Hello World!'
		});
		return;
	}
	

	for(var i=0; i<$list.length; i++){
		var map1 = parseFloat($list.eq(i).data('mapy'));
		var map2 = parseFloat($list.eq(i).data('mapx'));
		spots[i]={
				lat: map1, 
				lng: map2
		}
	}

	var bound = new google.maps.LatLngBounds();

	for (i = 0; i < spots.length; i++) {
		bound.extend( new google.maps.LatLng(spots[i]));
	}

	var centerp = bound.getCenter();

	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15,
		center: centerp
	});
	
	map.fitBounds(bound);

//	var service = new google.maps.places.RankBy.DISTANCE(map);

	var spotPath = new google.maps.Polyline({
		path: spots,
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	var labels = '123456789';

	for(var i=0; i<spots.length; i++){
		var marker=[];
		marker[i] = new google.maps.Marker({
			position: spots[i],
			map: map,
			label: labels[i]
		});
	}

	spotPath.setMap(map);

	var sortList=[];
	for(var i=0; i<spots.length-1; i++){
		console.log(i+' : '+getDistance(spots[i], spots[i+1]));
	}

}

function bestRouteMap(mapId){

	var $list = $('#sortable li');
	var spots = [];

	for(var i=0; i<$list.length; i++){
		var map1 = parseFloat($list.eq(i).data('mapy'));
		var map2 = parseFloat($list.eq(i).data('mapx'));
		spots[i]={
				lat: map1, 
				lng: map2
		}
	}

	var bound = new google.maps.LatLngBounds();

	for (i = 0; i < spots.length; i++) {
		bound.extend( new google.maps.LatLng(spots[i]));
	}

	var centerp = bound.getCenter();

	var map = new google.maps.Map(document.getElementById(mapId), {
		zoom: 13,
		center: centerp
	});

	routeMap = map;
	
	map.fitBounds(bound);

//	var service = new google.maps.places.RankBy.DISTANCE(map);

	spotPath = new google.maps.Polyline({
		path: spots,
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	var labels = '123456789';

	for(var i=0; i<spots.length; i++){
		marker[i] = new google.maps.Marker({
			position: spots[i],
			map: map,
			label: labels[i]
		});
	}

	spotPath.setMap(map);

	var sortList=[];
	for(var i=0; i<spots.length-1; i++){
		console.log(i+' : '+getDistance(spots[i], spots[i+1]));
	}

}


function getDistance(origin, destination){
	var disX = origin.lat - destination.lat;
	var disY = origin.lng - destination.lng;

	var distance = Math.sqrt(Math.abs(disX*disX)+Math.abs(disY*disY));

	return distance;
}

function drawLine(departure,arrival,time){
	var line = new google.maps.Polyline({
		path: [departure, departure],
		strokeColor: "#2630ff",
		strokeOpacity: 0.8,
		strokeWeight: 5,
		geodesic: true, //set to false if you want straight line instead of arc
		map: routeMap,
	});
	var step = 0;
	var numSteps = 100; //Change this to set animation resolution
	var timePerStep = 5; //Change this to alter animation speed
	setTimeout(() => {
		var interval = setInterval(function() {
			step += 1;
			if (step > numSteps) {
				clearInterval(interval);
			} else {
				var are_we_there_yet = google.maps.geometry.spherical.interpolate(departure,arrival,step/numSteps);
				line.setPath([departure, are_we_there_yet]);
			}
		}, timePerStep);
	}, time*750);
}
