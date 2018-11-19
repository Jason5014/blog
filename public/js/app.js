
var app = angular.module('BlogApp', ['ngCookies', 'BlogApp.configs', 'BlogApp.services', 'BlogApp.directives']);

//主控制器
app.controller('MainCtrl', ['$scope', 'SessionUser', function($scope, SessionUser){
    //初始化bootstrap提示组件
    angular.element('[data-toggle=tooltip]').tooltip();
    //回到顶部
    $scope.MoveToTop = function(){
        let c = document.documentElement.scrollTop || document.body.scrollTop;
        if( c > 0 ){
            window.requestAnimationFrame($scope.MoveToTop);
            window.scrollTo(0, c - c / 15);
        }
    };
    //用户退出
    $scope.quit = function(){
        SessionUser.quit();
        window.location.href = '/quit';
    };
}]);

/*
    公共访问页面控制器
    1. 注册页面
    2. 登录页面
    3. 主页面
    4. 博主页面
    5. 文章页面
    6. 搜索结果页面
    7. 博主信息页面
    8. 忘记密码
*/

//注册表单控制器
app.controller('SignUpCtrl', ['$scope', '$http', function ($scope, $http) {
    //初始化用户注册信息
    $scope.userdata = {};
    //注册表单提交函数
    $scope.SignUp = function(){
        angular.element('#vCodeImg').prop('src', '/getValidateCode?t=' + Date.now());
        $http({
            method: 'post',
            url: '/register',
            data: $scope.userdata
        })
            .then(function(data){
                data = data.data;
                if(data.status === 1){
                    window.location.href = '/info/register-success?email='+$scope.userdata.email;
                }else{
                    //更新验证码
                    angular.element('#vCodeImg').prop('src', '/getValidateCode?t=' + Date.now());
                    layer.msg(data.msg);
                }
            });
    };
    $scope.changeValidateCode = function(target){
        angular.element('#vCodeImg').prop('src', '/getValidateCode?t=' + Date.now());
    }
}]);

//登录页面控制器
app.controller('SignInCtrl', ['$scope', '$http', 'SessionUser', function($scope, $http, SessionUser){
    $scope.userdata = {};
    $scope.SignIn = function(){
        $http({
            method: 'post',
            url: '/login',
            data: $scope.userdata
        })
            .then(function(data){
                data = data.data;
                if(data.status === 1){
                    SessionUser.login(data.data);
                    window.location.href = '/';
                }else{
                    layer.msg(data.msg);
                    console.log(data.error);
                }
            });
    }
}]);

//主页控制器
app.controller('HomeCtrl', ['$scope', '$http', function($scope, $http){
    $scope.blogs = [];
    var category = window.location.search.substring('?category='.length);
    $scope.watch = {
        curr: 1,
        category: decodeURI(category) || '综合', // 选择分类
        sort: '-published'  //选择排序
    };
    //设置分页的参数
    $scope.option = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 8,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.watch.curr = page;
            $scope.MoveToTop();
        }
    };
    //获取最热文章
    $scope.getHot = function(){
        $scope.watch.sort = '-reading';
    };
    //获取最新文章
    $scope.getNew = function(){
        $scope.watch.sort = '-published';
    };
    //按分类获取文章
    $scope.getCategory = function(category){
        // 不刷新页面方式
        // 当重新选择分类时，回到第一页
        $scope.watch = {
            category: category,
            sort: $scope.watch.sort,
            curr: 1
        }
        //刷新页面方式，会有抖动
        // window.location.search = '?category=' + category;
    };
    //监听分页
    $scope.$watch('watch', function(watch){
        var url = '/page/blog?page='+watch.curr+'&size='+$scope.option.count+'&content=true';
        if(watch.category && watch.category !== '综合')
            url += '&category=' + watch.category;
        if(watch.sort)
            url += '&sort=' + watch.sort;
        //请求数据
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.option.all = Math.ceil(success.count / $scope.option.count);
                    $scope.blogs = success.data;
                }else{
                    layer.msg(success.msg)
                }
            });
    }, true);
}]);

//博主页面控制器
app.controller('BloggerCtrl', ['$scope', '$http', '$location', function($scope, $http, $location){
    $scope.blogger = angular.element('#blogger').attr('blogger');   //获取博主ID
    $scope.blogs = [];  //当前显示的文章列表
    $scope.count = 0;   //文章数
    $scope.view = true; //文章列表显示方式， true为摘要视图， false为目录视图
    //更换为摘要视图
    $scope.showAbstract = function(){
        $scope.view = true;
    };
    //更换为目录试图
    $scope.showCatalog = function(){
        $scope.view = false;
    };
    //从url中获取初始化个人分类
    var customCategory = window.location.search.substring('?customCategory='.length);
    //分页监听对象
    $scope.watch = {
        curr: 1,
        customCategory: customCategory || '',
        published: ''
    };
    //选择文章存档
    $scope.changeArchives = function(published){
        $scope.watch = {
            curr: 1,
            customCategory: '',
            published: published
        };
    };
    //选择个人分类
    $scope.changeCustomCategory = function(customCategory){
        $scope.watch = {
            curr: 1,
            customCategory: customCategory,
            published: ''
        };
    };
    //设置分页的参数
    $scope.option = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 8,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.option.curr = page;
            $scope.watch.curr = page;
            $scope.MoveToTop();
        }
    };
    //监听分页
    $scope.$watch('watch', function(watch){
        var url = '/page/blog?page='+watch.curr+'&size='+$scope.option.count+'&sort=-top'+'&content=true&comments=true&blogger='+$scope.blogger;
        if(watch.published){
            url += '&published='+watch.published;
        }
        if(watch.customCategory){
            url += '&customCategory='+watch.customCategory;
        }
        //请求数据
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.count = success.count;
                    $scope.option.all = Math.ceil(success.count / $scope.option.count);
                    $scope.blogs = success.data;
                }else{
                    layer.msg(success.msg)
                }
            });
    }, true);
}]);

//文章控制器
app.controller('PostCtrl', ['$scope', '$http', 'Comment', 'SessionUser', function($scope, $http, Comment, SessionUser){
    $scope.comment = '';
    $scope.length = 1000;
    $scope.id = angular.element('#blog-id').attr('blog');
    $scope.blog = angular.element('#blog-id').attr('blog-id');
    $scope.blogger = angular.element('#blogger').attr('blogger');
    //点赞
    $scope.praise = function () {
        if(SessionUser.logged(false)){
            $http.get('/praise/post/'+ $scope.id);
            angular.element('#praise').unbind('click')
                .bind('click', $scope.praised)
                .html('<i class="fa fa-heart" title="已赞" data-toggle="tooltip" data-placement="top"></i>')
        }
    };
    //取消点赞
    $scope.praised = function(){
        if(SessionUser.logged(false)) {
            $http.get('/praised/post/' + $scope.id);
            angular.element('#praise').unbind('click')
                .bind('click', $scope.praise)
                .html('<i class="fa fa-heart-o" title="赞" data-toggle="tooltip" data-placement="top"></i>')
        }
    };
    //收藏文章
    $scope.collect = function(){
        if(SessionUser.logged(false)){
            $http.get('/user/collect/post/'+ $scope.blog)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg('收藏成功！');
                        angular.element('#collect').unbind('click')
                            .bind('click', $scope.collected)
                            .html('<i class="fa fa-bookmark" title="已收藏" data-toggle="tooltip" data-placement="top"></i>');
                    }else{
                        layer.msg(success.msg);
                    }
                });

        }
    };
    //取消收藏
    $scope.collected = function(){
        if(SessionUser.logged(false)){
            $http.get('/user/collected/post/'+$scope.blog)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg('取消收藏成功！');
                        angular.element('#collect').unbind('click')
                            .bind('click', $scope.collect)
                            .html('<i class="fa fa-bookmark-o" title="收藏" data-toggle="tooltip" data-placement="top"></i>');
                    }else{
                        layer.msg(success.msg);
                    }
                })
        }
    };
    //编辑编辑评论
    $scope.commentChange = function(){
        if($scope.comment.length > 1000){
            $scope.comment = $scope.comment.substring(0, 1000);
        }
        $scope.length = 1000 - $scope.comment.length;
    };
    //发表评论
    $scope.publish = function(){
        var blogger = $scope.blogger;
        var group = '';
        var reply = 0;
        if($scope.comment.trim().length === 0)
            layer.msg('评论内容不能为空');
        else {
            var start = $scope.comment.indexOf('[reply]') + 7;
            var end = $scope.comment.indexOf('[/reply]');
            if (start < end) {
                var name = $scope.comment.substring(start, end);
                var result = Comment.compare(name);
                if(result){
                    reply = 1;      //评论类型改为回复评论
                    blogger = result.blogger;
                    group = result.group;
                }
            }
            $http.post('/user/comment', {
                blog: $scope.blog,
                blogger: blogger,
                reply: reply,
                content: $scope.comment,
                group: group
            }).then(function (success) {
                success = success.data;
                if (success.success) {
                    layer.msg(success.msg);
                    $scope.comment = '';
                    $scope.watch.add ++;
                } else {
                    layer.msg(success.msg);
                }
            });
        }
    };
    //回复功能
    $scope.reply = function(index, i){
        var id = $scope.comments[index].group[i+1].publisher._id;
        var name = $scope.comments[index].group[i+1].publisher.nickname;
        var group = $scope.comments[index].group[i+1].group;
        console.log(id, name, group);
        if(SessionUser.logged()){
            Comment.replied(id, name, group);  //暂存回复对象
            angular.element('#comment-textarea').text('[reply]'+ name +'[/reply]\n').focus();
        }
    };
    //查看回复
    $scope.showReply = function(index){
        $scope.comments[index].show = !$scope.comments[index].show;
    };
    //评论分页功能
    $scope.comments = [];
    $scope.commentsCount = 0;
    $scope.watch = {
        curr: 1,
        add: 0
    };
    $scope.commentOption = {
        curr: 1,
        all: 1,
        count: 5,
        click: function(page){
            $scope.commentOption.curr = page;
            $scope.watch.curr = page;
        }
    };
    $scope.$watch('watch', function(comment){
        var url = "/page/comment?page="+comment.curr+'&size='+$scope.commentOption.count+'&blog='+$scope.blog;
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.commentOption.all = Math.ceil(success.count / $scope.commentOption.count);
                    $scope.comments = success.data;
                    $scope.commentsCount = 0;
                    $scope.comments.forEach(function(item){
                        $scope.commentsCount += item.group.length;
                    });
                }
                else layer.msg(success.msg)
            });

    }, true);
}]);

//搜索页面控制器
app.controller('SearchCtrl', ['$scope', '$http', function($scope, $http){
    $scope.query = '';   //查询字符串
    $scope.options = {};
    $scope.blogs = [];
    var search = window.location.search.slice(1);    //q=我是谁&blogger=23435245
    search = search.split('&');
    search.forEach(function(str){
        var str = str.split('=');
        $scope.options[str[0]] = decodeURI(str[1]);
    });
    $scope.query = $scope.options.q;
    //搜索
    $scope.search = function(){
        if($scope.query){
            // $scope.watch.query = $scope.query;
            window.location.search = '?q='+$scope.query + ( $scope.options.id ? '&id=' + $scope.options.id : '' );
        }
        else
            layer.msg('搜索内容不为空');
    };
    $scope.watch = {
        curr: 1,
        query: $scope.options.q
    };
    $scope.option = {
        curr: 1,
        all: 1,
        count: 10,
        click: function(page){
            $scope.option.curr = page;
            $scope.watch.curr = page;
        }
    };
    $scope.$watch('watch', function(watch){
        var url= '/page/search?page='+watch.curr+'&size='+$scope.option.count+'&q='+watch.query;
        if($scope.options.id)
            url += '&blogger='+$scope.options.id;
        $http.get(url).then(function(success){
            success = success.data;
            if(success.success){
                $scope.option.all = Math.ceil(success.count / $scope.option.count);
                $scope.blogs = success.data;
            }
            else layer.msg(success.msg);
        })
    }, true);
}]);

//博主信息页面控制器
app.controller('BlogInfoCtrl', ['$scope', '$http', function($scope, $http){
    $scope.blogger = angular.element('#blogger').attr('blogger');
    $scope.blogs = [];
    //设置分页的参数
    $scope.option = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 5,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.option.curr = page;
        }
    };
    //监听分页
    $scope.$watch('option.curr', function(page){
        var url = '/page/blog?page='+page+'&size='+$scope.option.count+'&sort=-top&content=true&comments=true&blogger='+$scope.blogger;
        //请求数据
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.count = success.count;
                    $scope.option.all = Math.ceil(success.count / $scope.option.count);
                    $scope.blogs = success.data;
                }else{
                    layer.msg(success.msg)
                }
            });
    }, true);
}]);

//忘记密码控制器
app.controller('ForgotPasswordCtrl', ['$scope', '$http', function($scope, $http){
    $scope.step = 1;
    $scope.emaildata = {};
    $scope.passworddata = {};
    //更换验证码
    $scope.changeCode = function(target){
        angular.element(target).attr('src', '/getValidateCode?t=' + Date.now());
    };
    //发送邮箱验证码
    $scope.getCode = function(target){
        var email = $scope.emaildata.email;
        if(!email){
            layer.msg('邮箱不为空');
        }else if(!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(email.toLowerCase())){
            layer.msg('邮箱格式错误');
        }else{
            $http.get('/sendVCode?email='+email)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg('验证码已发送至邮箱');
                        angular.element(target).attr('disabled', true);
                        angular.element(target).html('验证码已发送');
                    }
                    else
                        layer.msg(success.msg);
                });
        }
    };
    //第一步 邮箱验证
    $scope.emailValidate = function(){
        $http.post('/emailValidate', $scope.emaildata)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.step ++;
                }
                else layer.msg(success.msg);
            });
    };
    //第二布 修改密码
    $scope.changePassword = function(){
        $http.post('/password/change?email='+$scope.emaildata.email, $scope.passworddata)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.step ++;
                }
                else layer.msg(success.msg);
            });
    };
}]);