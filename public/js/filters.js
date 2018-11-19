
var filters = angular.module('BlogApp.filters', []);

// html 信任
app.filter('to_trusted', ['$sce', function ($sce) {
    return function (text) {
        return $sce.trustAsHtml(text);
    };
}]);

// 日期格式化
app.filter('formatDate', function(){
    return function(date){
        var differ = Date.now() - new Date(date).getTime();
        var SECOND = 1000;
        var MINUTE = 60 * SECOND;
        var HOUR = 60 * MINUTE;
        var DAY = 24 * HOUR;
        if(differ < MINUTE){
            return '刚刚';
        }else if(differ < HOUR){
            return Math.floor(differ / MINUTE) + '分钟前';
        }else if(differ < DAY){
            return Math.floor(differ / HOUR) + '小时前';
        }else{
            return new Date(date).toLocaleDateString();
        }
    }
});

//状态显示
app.filter('status', function(){
    return function(status){
        var result = '';
        switch (status){
            case 0: result = '未发布'; break;
            case 1: result = '已发布'; break;
            case 2: result = '待审核'; break;
            case 3: result = '被举报'; break;
            case 4: result = '已删除'; break;
            default: break;
        }
        return result;
    }
});

//状态样式
app.filter('statusClass', function(){
    return function(status){
        var result = '';
        switch (status){
            case 0: result = 'font-unpublished'; break;
            case 1: result = 'font-published'; break;
            case 2: result = 'font-audit'; break;
            case 3: result = 'font-reported'; break;
            case 4: result = 'font-deleted'; break;
            default: break;
        }
        return result;
    }
});

//搜索结果高亮
app.filter('highlight', function(){
    return function(text, query){
        return text;
    }
});