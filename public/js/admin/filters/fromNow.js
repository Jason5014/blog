'use strict';

/* Filters */
// need load the moment.js to use this filter. 
angular.module('app')
  .filter('fromNow', function() {
    return function(date) {
      return moment(date).fromNow();
    }
  })
.filter('PostStatus', function(){
    return function(status){
        var result = '';
        switch(status){
            case 0: result = '待发布'; break;
            case 1: result = '已发布'; break;
            case 2: result = '待审核'; break;
            case 3: result = '被举报'; break;
            case 4: result = '已删除'; break;
            default: result = '未定义'; break;
        }
        return result;
    }
});