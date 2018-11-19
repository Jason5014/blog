
var directives = angular.module('BlogApp.directives', ['BlogApp.configs']);

//比较密码与确认密码是否一致
directives.directive('compare', [ function(){
    return {
        strict: 'AE',
        scope: {
            orgText: '=compare'
        },
        require: 'ngModel',
        link: function(scope, ele, attrs, ctrl){
            ctrl.$validators.compare = function(v){
                return v === scope.orgText;
            };
            scope.$watch('orgText', function(){
                ctrl.$validate();
            });
        }
    }
}]);

//关注按钮
directives.directive('focus', ['$http', 'SessionUser', function($http, SessionUser){
    return {
        strict: 'AE',
        link: function(scope, ele, attrs){
            var focus = function(){
                if(SessionUser.logged()){
                    if(attrs.focus)
                        $http.get('/user/focus/'+attrs.focus)
                            .then(function(success){
                                success = success.data;
                                layer.msg(success.msg);
                                if(success.success){
                                    ele.html('<i class="fa fa-minus icon-margin"></i>  已关注');
                                    ele.unbind('click').bind('click', focused);
                                }
                            });
                    else
                        layer.msg('关注失败');
                }
            };
            var focused = function(){
                if(attrs.focus)
                    $http.get('/user/cancelFocus/'+attrs.focus)
                        .then(function(success){
                            success = success.data;
                            layer.msg(success.msg);
                            if(success.success){
                                ele.html('<i class="fa fa-plus icon-margin"></i>  关注');
                                ele.unbind('click').bind('click', focus);
                            }
                        });
                else
                    layer.msg('关注失败');
            };
            if(SessionUser.logged(true)){
                $http.get('/user/focused/'+attrs.focus)
                    .then(function(success){
                        success = success.data;
                        if(success.success){
                            ele.html('<i class="fa fa-minus icon-margin"></i>  已关注');
                            ele.unbind('click').bind('click', focused);
                        }else{
                            ele.unbind('click').bind('click', focus);
                        }
                    });
            }
            else
                ele.unbind('click').bind('click', focus);
        }
    }
}]);

//Markdown编辑器
directives.directive('markdown', function(){
    return {
        restrict: 'A',
        link: function(scope, ele, attrs){
            scope.content = ele.text();
        }
    }
});

//确认提示
directives.directive('confirm', function(){
    return {
        restrict: 'A',
        scope: {
            opt: '=confirmOpt',
        },
        link: function(scope, ele, attrs){
            ele.bind('click', function(){
                layer.confirm(scope.opt.msg, {
                    title: scope.opt.title,
                    btn: ['确认','取消'] //按钮
                }, function(){
                    scope.opt.cb(attrs.confirm);
                    layer.closeAll('dialog');
                } );
            });
        }
    }
});

//分页
directives.directive('pagination', function(){
    return {
        restrict: 'AE',
        scope: {
            option: '=pageOption'
        },
        template: '<nav class="text-center" ng-show="page.length > 5"><ul class="pagination arrow pagination-sm">' +
        '<li ng-click="pageClick(p)" ng-repeat="p in page" ng-class="{active: option.curr == p, disabled: option.curr == 1 && (p == \'上一页\' || p == \'首页\') || option.curr == option.all && (p == \'下一页\' || p == \'尾页\')}">' +
        '<a>{{p}}</a></li></ul></nav>',
        replace: true,
        link: function($scope){
            //容错处理
            if (!$scope.option.curr || isNaN($scope.option.curr) || $scope.option.curr < 1) $scope.option.curr = 1;
            if (!$scope.option.all || isNaN($scope.option.all) || $scope.option.all < 1) $scope.option.all = 1;
            if ($scope.option.curr > $scope.option.all) $scope.option.curr = $scope.option.all;
            if (!$scope.option.count || isNaN($scope.option.count) || $scope.option.count < 1) $scope.option.count = 5;
            $scope.$watch('option.all', function(all){
                    //得到显示页数的数组
                    $scope.page = getRange($scope.option.curr, all, $scope.option.count);
                });
            //绑定点击事件
            $scope.pageClick = function (page) {
                if (page === '上一页') {
                    page = parseInt($scope.option.curr) - 1;
                } else if (page === '下一页') {
                    page = parseInt($scope.option.curr) + 1;
                } else if (page === '首页'){
                    page = 1;
                } else if (page === '尾页'){
                    page = $scope.option.all;
                }
                if (page < 1) page = 1;
                else if (page > $scope.option.all) page = $scope.option.all;
                //点击相同的页数 不执行点击事件
                if (page === $scope.option.curr) return;
                if ($scope.option.click && typeof $scope.option.click === 'function') {
                    $scope.option.click(page);
                    $scope.option.curr = page;
                    $scope.page = getRange($scope.option.curr, $scope.option.all, $scope.option.count);
                }
            };
            //返回页数范围（用来遍历）
            function getRange(curr, all, count) {
                //计算显示的页数
                curr = parseInt(curr);
                all = parseInt(all);
                count = parseInt(count);
                var from , to;
                if( count > 10 ){
                    from = curr - parseInt(count / 2);
                    to = curr + parseInt(count / 2) + (count % 2) - 1;
                    //显示的页数容处理
                    if (from <= 0) {
                        from = 1;
                        to = from + count - 1;
                        if (to > all) {
                            to = all;
                        }
                    }
                    if (to > all) {
                        to = all;
                        from = to - count + 1;
                        if (from <= 0) {
                            from = 1;
                        }
                    }
                }else{
                    from = 1;
                    to = all;
                }
                var range = [];
                for (var i = from; i <= to; i++) {
                    range.push(i);
                }
                range.unshift('上一页');
                range.unshift('首页');
                range.push('下一页');
                range.push('尾页');
                return range;
            }
        }
    }

});

//动态高度
directives.directive('resize', ['$window', function($window){
    return function (scope, element) {
        var w = angular.element($window);
        var e = angular.element(element);
        var nav = 85;
        var footer = 150;
        scope.getWindowDimensions = function () {
            return { 'h': w.height() };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue) {
            scope.style = function (h, height) {
                if(typeof h !== 'undefined') nav = h;
                if(!height){
                    var newHeight = newValue.h - nav - footer;
                    var marginTop = (newHeight - e.height() ) / 2;
                    return {
                        'margin-top': marginTop + 'px',
                        'margin-bottom': marginTop + 'px'
                    };
                }
                else{
                    return {
                        'min-height': newValue.h - nav -footer
                    }
                }
            };
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    }
}]);

//侧边导航栏
directives.directive('scrollSpy', function($window) {
    return {
        restrict: 'A',
        controller: function($scope) {
            $scope.spies = [];
            this.addSpy = function(spyObj) {
                return $scope.spies.push(spyObj);
            };
        },
        link: function(scope, elem, attrs) {
            var spyElems = [];
            scope.$watch('spies', function(spies) {
                for(let i in spies){
                    let spy = spies[i];
                    if(!spyElems[spy.id])
                        spyElems[spy.id] = elem.find('#'+spy.id);
                }
            });
            $($window).scroll(function() {
                var highligthSpy = null;
                for(let i in scope.spies){
                    let spy = scope.spies[i];
                    spy.out();
                    var pos = spyElems[spy.id].offset().top;
                    if(pos - $window.scrollY - 20 <= 0 ){
                        spy.pos = pos;
                        if(!highligthSpy) highligthSpy = spy;
                        if(highligthSpy.pos < spy.pos) highligthSpy = spy;
                    }
                }
               if(highligthSpy) highligthSpy.in();
            });
        }
    };
});

directives.directive('spy', ['$location', '$anchorScroll', function($location, $anchorScroll) {
    return {
        restrict: "A",
        require: "^scrollSpy",
        link: function(scope, elem, attrs, affix) {
            var anchor = $location.url();
            if(anchor === ('#'+attrs.spy)) elem.addClass('active');
            angular.element(elem).bind('click', function () {
                $location.hash(attrs.spy);
                $anchorScroll();
            });
            affix.addSpy({
                id: attrs.spy,
                in: function() {
                    return elem.addClass('active');
                },
                out: function() {
                    return elem.removeClass('active');
                }
            });
        }
    };
}]);

//弹出层
directives.directive('popover', [ function(){
    return {
        restrict: 'AE',
        link: function(scope, ele, attr){
            // scope.blogger = attr.popover;
            // var blogger = attr.popover;
            // var html = '<span>'+blogger.nickname+'</span>';
            // console.log(blogger);
            // angular.element(ele).popover({
            //     title: '博主信息',
            //     trigger: 'hover',
            //     placement: 'top',
            //     html: true,
            //     content: html
            // });
        }
    }
}]);