'use strict';

angular.module('cosla').controller('attSignTimeCtrl',function($scope, Restangular, $routeParams, $filter) {
    $scope.showName = 'attSignTime';
    $scope.titleName = "签到签退";
    $scope.signIn = {};
    //当天日期
    $scope.todayTime = commonDateFormat(true, 0, 0, 0);
    //获取系统当前时间
    var month = null;
    var year = null;
    Restangular.one('attendance/getCurrentTime').get().then(function(result) {
        $scope.currentTime = result.currentTime;
        // 取得月份
        month = $filter('date')($scope.currentTime, 'MM');
        //获取年份
        year = $filter('date')($scope.currentTime, 'yyyy');
    });

    var initDate = function() {
        // 页面初期签到签退时间获取
        Restangular.one('attendance/getUserAttendanceByDate').get().then(function(result) {
            if (result != undefined) {
                $scope.startTime = result.startTime != '' ? $filter('date')(result.startTime, 'HH:mm:ss') : '';
                $scope.endTime = result.endTime != '' ? $filter('date')(result.endTime, 'HH:mm:ss') : '';
            }
        });
    };

    initDate();
    $scope.saveSignIn = function(type) {
        var data = $scope.signIn;
        var method;
        if (type == "1") {
            method = 'attendance/datein';
        } else {
            method = 'attendance/dateout';
        }
        var attendanceData = Restangular.all(method);
        attendanceData.post(data).then(function(result) {
            if (result.success == false) {
            	//人工生成数据
            	$.messager.confirm('您今天不在考勤规则范围内，确认继续签到？',function(ok) {
                    if (ok) {
                    	$scope.createAttendan();
                    	$('#signIn').modal('hide');
                    }else{
                    	$('#signIn').modal('hide');
                    }
                });
            } else {
                alert(result.msg);
                //$('a.close-reveal-modal').trigger('click');
                $('#signIn').modal('hide');
                initDate();
                if (type == "1") {
                    $scope.signTime = result.date;
                } else {
                    $scope.signOutTime = result.date;
                }
                $scope.signIn.reason = null;
                // 更新日历中今日的时间
                //				getCalendar(result.date);
            }

        });
    };
    //提交迟到、早退原因
    var saveSignIn = function(type) {
        var data = $scope.signIn;
        var method;
        if (type == "1") {
            method = 'attendance/datein';
        } else {
            method = 'attendance/dateout';
        }
        var attendanceData = Restangular.all(method);
        attendanceData.post(data).then(function(result) {
            if (result.success == false) {
            	//人工生成数据
            	$.messager.confirm('您今天不在考勤规则范围内，确认继续签到？',function(ok) {
                    if (ok) {
                    	$scope.createAttendan();
                    }else{
                    	$('#signIn').modal('hide');
                    }
                });
            } else {
                alert(result.msg);
                initDate();
                if (type == "1") {
                    $scope.signTime = result.date;
                } else {
                    $scope.signOutTime = result.date;
                }
                // 更新日历中今日的时间
                //				getCalendar(result.date);
            }

          //  $('a.close-reveal-modal').trigger('click');
            $('#signIn').modal('hide');
        });
    };
    // 签到，签退处理
    $scope.doSign = function(type) {
        var method;
        var updateTime = {};
        updateTime.userid = $scope.user.userId;
        $scope.button = {};
        check(type);
        if (type == "2") {
            if ($scope.startTime == undefined || $scope.startTime == "") {
                alert("请先签到然后再签退");
                return;
            }
        }
       if($scope.randCheckCode==null||$scope.randCheckCode==""){
    	   alert("请输入验证码");
       }else{
    	   Restangular.one('userAttendanceConfig/queryBySignIn/'+ type+'/'+$scope.randCheckCode).get().then(function(result) {
               if (result == undefined) {
                   saveSignIn(type);
               }
               if (result.isRandCheck == "0") {
               	alert("校验码不正确，请重新输入");
               	return;
               }
               if (type == "1") {
                   if (result.isLate == "1") {
                       $.messager.confirm('请填写迟到的原因!',function(ok) {
                           if (ok) {
                               if (confirm.code == undefined) {
                                   $('#signIn').modal('show');    
                                   $scope.signIn.opType = "1";
                                   return;
                               }
                           }
                       });
                   } else {
                       saveSignIn(type);
                   }

               } else {
                   if (result.isLeaveEarly == "1") {
                       $.messager.confirm('请填写早退的原因!',function(ok) {
                           if (ok) {
                               if (confirm.code == undefined) {
                               	$('#signIn').modal('show');    
                                   $scope.signIn.opType = "2";
                                   return;
                               }
                           }
                       });
                   } else {
                       saveSignIn(type);
                   }
               }
           });
       }
       
    };

    //考勤提示--确定
    $scope.createAttendan = function(){
    	var data = $scope.signIn;
    	data.opDate = $scope.todayTime;
    	var attendanceData = Restangular.all('attendance/createTodayAttendance');
        attendanceData.post(data).then(function(result) {
    		if (result.error) {
                alert(result.msg);
            } else {  
				notice("新建考勤数据成功！",2000,"success");
				$('a.close-reveal-modal').trigger('click');
				initDate();
            }
  		});
    };
    
    //点击取消按钮关闭弹出框
    $scope.closeSignIn = function() {
        $scope.signIn.reason = null;
        $('#signIn').modal('hide');
    };
    function check(type) {
        $scope.opType = type;
    };
    
    //重新加载验证码
    $scope.myReload =function() {  
        document.getElementById("CreateCheckCode").src = "PictureCheckCode?nocache=" + new Date().getTime();  
    };
    $scope.randCheckCode="";
    
    //页面加载完毕 绑定事件
    $(document).ready(function(){
    	$scope.myReload();
    });
    
});
