
var app = angular.module('BlogApp');

/*
    用户个人页面控制器
    1. 用户信息页面
    2. 新建博客以及编辑博客压敏
    3. 编辑个人信息页面
    4. 博客管理页面
*/

//用户信息页面控制器
app.controller('UserInfoCtrl', ['$scope', '$http', function($scope, $http){
    $scope.blogger = angular.element('#blogger').attr('blogger');
    $scope.blogs = [];
    $scope.collections = [];
    $scope.follows = [];
    $scope.fans = [];
    $scope.panel = 'blog';
    //分页监听器
    $scope.watcher = $scope.watcher=$scope.$watch('watch.blog', watchBlog);
    //分页监听器切换
    $scope.watchSwitch = function(panel){
        if($scope.panel !== panel){
            $scope.watcher();   // 关闭上一个监听器
            $scope.panel = panel;
            //打开下一个监听器
            switch(panel){
                case 'blog': $scope.watcher=$scope.$watch('watch.blog', watchBlog, true); break;
                case 'collection': $scope.watcher=$scope.$watch('watch.collection', watchCollection, true); break;
                case 'follow': $scope.watcher=$scope.$watch('watch.follow', watchFollow, true); break;
                case 'fans': $scope.watcher=$scope.$watch('watch.fans', watchFans); break;
                default: break;
            }
        }
    };
    //计数器
    $scope.count = {
        follows: 0,
        fans: 0
    };
    //编辑用户信息按钮
    $scope.editInfo = function(){
        layer.open({
            type: 2,
            content: ['/user/editinfo', 'no'],
            title: '编辑个人信息',
            area: ['660px', '550px']
        })
    };
    //待监听数据 - 即所有分页页数
    $scope.watch = {
        blog: {
            curr: 1,
            deleted: 0
        },
        collection: {
            curr: 1,
            deleted: 0
        },
        follow: {
            curr: 1,
            deleted: 0
        },
        fans: 1
    };
    //博客分页参数
    $scope.blogOption = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 5,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.blogOption.curr = page;
            $scope.watch.blog.curr = page;
        }
    };
    //监听博客分页
    function watchBlog(blog){
        var url = '/page/blog?page=' + blog.curr + '&size=' + $scope.blogOption.count + '&blogger='+$scope.blogger+'&visible=true';
        //请求数据
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.blogOption.all = Math.ceil(success.count / $scope.blogOption.count);
                    $scope.blogs = success.data;

                }
                else layer.msg(success.msg)
            });
    }
    //删除博客
    $scope.deleteOpt = {
        msg: '是否确认删除',
        title: '删除博客',
        cb: function(id) {
            console.log('删除博客：' + id);
            $http.get('/user/remove/blog/' + id)
                .then(function (success) {
                    success = success.data;
                    if (success.success) {
                        layer.msg(success.data);
                        $scope.watch.blog.deleted ++;
                    } else {
                        layer.msg(success);
                    }
                })
        }
    };
    //收藏分页参数
    $scope.collectionOption = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 5,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.collectionOption.curr = page;
            $scope.watch.collection.curr = page;
        }
    };
    //监听收藏分页
    function watchCollection(collection){
        var url = '/page/blog?page='+collection.curr+'&size='+$scope.collectionOption.count+'&collected=blogger';
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.collectionOption.all = Math.ceil(success.count / $scope.collectionOption.count);
                    $scope.collections = success.data;
                }else{
                    layer.msg(success.msg)
                }
            });
    }
    //取消收藏
    $scope.cancelColl = {
        msg: '是否确认取消收藏该文章？',
        title: '取消收藏',
        cb: function(id){
            $http.get('/user/collected/post/'+id)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg(success.msg);
                        $scope.watch.collection.deleted --;
                    }else{
                        layer.msg(success.msg);
                    }
                });
        }
    };
    //关注分页参数
    $scope.followOption = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 8,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.followOption.curr = page;
            $scope.watch.follow.curr = page;
        }
    };
    //监听关注分页
    function watchFollow(follow){
        var url = '/user/page/blogger?page='+follow.curr+'&size='+$scope.followOption.count+'&follows=true';
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.followOption.all = Math.ceil(success.count / $scope.followOption.count);
                    $scope.follows = success.data;
                    $scope.count.follows = success.count;
                }else{
                    layer.msg(success.msg)
                }
            });
    }
    $scope.cancelFocus = function(index){
        var id = $scope.follows[index]._id;
        if(id){
            $http.get('/user/cancelFocus/'+id)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg('取消关注成功');
                        $scope.watch.follow.deleted ++;
                    }
                    else
                        layer.msg(success.msg);
                });
        }
    };
    //粉丝分页参数
    $scope.fansOption = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 8,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.fansOption.curr = page;
            $scope.watch.fans = page;
        }
    };
    //监听粉丝分页
    function watchFans(page){
        var url = '/user/page/blogger?page='+page+'&size='+$scope.fansOption.count+'&fans=true';
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.fansOption.all = Math.ceil(success.count / $scope.fansOption.count);
                    $scope.fans = success.data;
                    $scope.count.fans = success.count;
                }else{
                    layer.msg(success.msg)
                }
            });
    }
}]);

//编辑博客控制器
app.controller('BloggingCtrl', ['$scope', '$http', '$location', '$compile', function($scope, $http, $location, $compile){
    var url = $location.absUrl(),
        id = url.substring(url.lastIndexOf('/')+1);
    $scope.id = id;
    //获取博客内容
    $http.get('/user/post/'+id)
        .then(function(success){
            success = success.data;
            if(success.success){
                $scope.blog = success.data;
                //初始化个人分类状态
                angular.element('#customCategoryList li').toArray().forEach(function(item, index){
                    var data = item.childNodes[0].value;
                    if($scope.blog.customCategory.indexOf(data) !== -1){
                        angular.element(item.childNodes[0]).attr('checked', true);
                    }
                });
                $scope.blog.visible = !$scope.blog.visible;
            }
            else
                layer.alert('文章不存在', function(){
                    window.location.href = '/info/post-not-found'
                });
        });
    //离开页面时，将编辑的数据暂存到后台
    angular.element(window).bind('beforeunload', function(){
        $http.post('/user/save/blogging/'+id, $scope.blog); // 离开前将数据发送到后台暂存
        window.event.returnValue = '您输入的内容尚未保存，确定离开此页面吗？';
    });
    //加载Markdown编辑器
    editormd('blog-editor', {
        width: '90%',
        height: 650,
        path: '/bower_components/editor.md/lib/',
        coldFlod: true,
        saveHTMLToTextarea: true,
        searchReplace: true,
        htmlDecode: 'script,style,iframe|on*',
        emoij: true,
        tasklist: true,
        tocm: true,
        tex: true,
        flowChart: true,
        sequenceDiagram: true,       // 开启时序/序列图支持，默认关闭,
        imageUpload: true,
        imageFormats: ['jpg', 'jpeg', 'gif', 'png', 'bmp', 'webp'],
        imageUploadURL: '/user/imageUpload/',
        onchange: function(){
            //当内容发生变化时，同步到数据缓存中
            $scope.blog.content = this.getValue();
        }
    });
    //添加标签
    $scope.addLabel = function(){
        angular.element('#labels').append($compile('<li><input type="text" ng-blur="addToLabel($event.target)"> <a ng-click="removeLabel($event.target)"><i class="glyphicon glyphicon-remove "></i></a></li>')($scope));
        angular.element('#labels li:last-child input').focus();
    };
    $scope.addToLabel = function(target){
        target = angular.element(target);
        var name = target.val();
        if(name !== ''&& $scope.blog.labels.indexOf(name) === -1){
            $scope.blog.labels.push(name);
        }
        target.parent('li').remove();
    };
    //编辑标签
    $scope.editLabel = function(target, oldName){
        target = angular.element(target);
        var name = target.val();
        if(name === '' || $scope.blog.labels.indexOf(name) !== -1){
            target.val(oldName);
            layer.msg('标签名不为空或标签已存在');
        }
        else if(oldName !== name){
            var location = $scope.blog.labels.indexOf(oldName);
            $scope.blog.labels[location] = name;
        }
    };
    //控制标题长度
    $scope.editTitle = function(){
        var title = $scope.blog.title;
        if(title.length > 30){
            layer.msg('标题不超过30个字');
            $scope.blog.title = title.substring(0, 30);
        }
    };
    //删除标签
    $scope.removeLabel = function(target){
        var li = angular.element(target).parents('li');
        var name = angular.element(li).children('input').val();
        if(name){
            var location = $scope.blog.labels.indexOf(name);
            $scope.blog.labels.splice(location, 1);
        }
    };
    //发布文章
    $scope.publish = function(){
        var result = format($scope.blog);
        if(result) layer.msg(result);
        else{
            $scope.blog.status = 1; // 设定文章状态为已发布
            //获取博客的个人分类
            var sorts = angular.element('input[name=sorts]:checked').toArray();
            $scope.blog.customCategory = [];
            for(var item in sorts){
                var cid = angular.element(sorts[item]).val();
                $scope.blog.customCategory.push(cid);
            }
            $scope.blog.visible = !$scope.blog.visible;
            $http.post('/user/blogging/'+ id, $scope.blog)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        angular.element(window).unbind('beforeunload');
                        window.location.href = '/info/post-publish-success?id='+$scope.blog.id;
                    }else{
                        $scope.blog.status = 0; //还原文章状态
                        layer.msg(success.msg);
                    }
                });
        }
    };
    //保存博客
    $scope.save = function(){
        var result = format($scope.blog);
        if(result) layer.msg(result);
        else{
            $scope.blog.status = 0; //设置博客状态为待发布
            //获取博客的个人分类
            var sorts = angular.element('input[name=sorts]:checked').toArray();
            $scope.blog.customCategory = [];
            for(var item in sorts){
                console.log(item);
                var cid = angular.element(sorts[item]).val();
                $scope.blog.customCategory.push(cid);
            }
            $scope.blog.visible = !$scope.blog.visible;
            $http.post('/user/blogging/'+ id, $scope.blog)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        angular.element(window).unbind('beforeunload');
                        window.location.href = '/info/post-save-success?id='+$scope.blog.id;
                    }else{
                        layer.msg(success.msg);
                    }
                });
        }
    };
    //编辑博客
    $scope.edit = function(){
        var result = format($scope.blog);
        if(result) layer.msg(result);
        else{
            //获取博客的个人分类
            var sorts = angular.element('input[name=sorts]:checked').toArray();
            $scope.blog.customCategory = [];
            for(var item in sorts){
                console.log(item);
                var cid = angular.element(sorts[item]).val();
                $scope.blog.customCategory.push(cid);
            }
            $scope.blog.visible = !$scope.blog.visible;
            $http.post('/user/blogging/'+ id, $scope.blog)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        angular.element(window).unbind('beforeunload');
                        window.location.href = '/info/post-edit-success?id='+$scope.blog.id;
                    }else{
                        layer.msg(success.msg);
                    }
                });
        }
    };
    //取消编辑
    $scope.cancel = function(){
        $http.get('/user/cancel/blogging/'+id)
            .then(function(){
                angular.element(window).unbind('beforeunload');
                window.location.href = '/';
            });
    };
    function format(blog){
        var msg = '';
        if(blog.title === ''){
            msg = '标题不为空！'
        }else if(blog.title === '欢迎使用Markdown编辑器'){
            msg = '标题不能为预定义标题！'
        }else if(blog.content === ''){
            msg = '文章内容不为空！'
        }else if(blog.category === '0'){
            msg = '文章分类未选择'
        }
        return msg;
    }
}]);

//编辑个人信息控制器
app.controller('EditInfoCtrl', ['$scope', '$http', function($scope, $http){
    $scope.blogger = {};
    $scope.length = 300;
    //获取用户信息
    $http.get('/user/blogger/info')
        .then(function(success){
            success = success.data;
            if(success.success){
                var data = success.data;
                data.birthday = data.birthday.substring(0, 10);
                $scope.blogger = data;
                $scope.length = 300 - $scope.blogger.profile.length;
                $scope.address = $scope.blogger.address || '';
                //加载日期选择器
                new Schedule({
                    el: '#schedule-box',
                    date: $scope.blogger.birthday,
                    clickCb: function (y,m,d) {
                        var date = $scope.formatDate(y, m, d, '-');
                        $scope.blogger.birthday = date;
                        angular.element('#birthday').val(date);
                        angular.element('#schedule-box').css('display', 'none');
                    }
                });
                //加载地址选择器
                $('#address').citypicker($scope.formatAddress($scope.blogger.address));
            }else{
                layer.msg(success.msg);
            }
        });
    //显示日期选择器
    $scope.showSchedule = function(){
        angular.element('#schedule-box').css('display', 'block');
    };
    angular.element('#schedule-box').bind('mouseleave', function(){
        angular.element('#schedule-box').css('display', 'none');
    });
    //编辑个人简介，统计长度
    $scope.editProfile = function(){
        var profile = $scope.blogger.profile;
        if(profile.length > 300){
            $scope.blogger.profile = profile.substring(0, 300);
        }
        $scope.length = 300 - $scope.blogger.profile.length;
    };
    //重置地址初始值
    $scope.resetAddress = function(){
        $('#address').citypicker('reset');
        $("#address").citypicker("destroy");
        $("#address").citypicker($scope.formatAddress($scope.address));
        $scope.blogger.address = $scope.address;
    };
    //提交编辑信息
    $scope.submit = function(){
        $scope.blogger.address = $('#address').val();   //将地址信息写回
        $http.post('/user/editinfo', $scope.blogger)
            .then(function(success){
                success = success.data;
                if(success.success){
                    var index = parent.layer.getFrameIndex(window.name);
                    parent.layer.close(index);
                    window.parent.location.reload(); //刷新父页面
                }else{
                    layer.msg(success.msg);
                }
            });
    };
    //关闭弹框
    $scope.cancel = function(){
        var index = parent.layer.getFrameIndex(window.name);
        parent.layer.close(index);
    };
    //日期格式化
    $scope.formatDate = function(y,m,d,symbol) {
        symbol = symbol || '-';
        m = (m.toString())[1] ? m : '0'+m;
        d = (d.toString())[1] ? d : '0'+d;
        return y+symbol+m+symbol+d
    };
    //地址格式化
    $scope.formatAddress = function(address){
        if(!address) return ;
        let arr = address.toString().split('/');
        return {
            province: arr[0] || '',
            city: arr[1] || '',
            district: arr[2] || ''
        }
    }
}]);

//博客管理控制器
app.controller('BlogManageCtrl', ['$scope', '$http', function($scope, $http){
    $scope.blogger = angular.element('#blogger').attr('blogger');
    $scope.customCategoryList = [];
    $scope.categoryList = [];
    $http.get('/user/CustomCategory/list')
        .then(function(success){
            success = success.data;
            if(success.success){
                $scope.customCategoryList = success.data;
            }else
                layer.msg(success.msg);
        });
    $http.get('/category/list')
        .then(function(success){
            success = success.data;
            if(success.success){
                $scope.categoryList = success.data;
            }
            else layer.msg(success.msg);
        });
    $scope.blogs = [];
    $scope.collections = [];
    $scope.customCategorys = [];
    $scope.copyCustomCategorys = []; //备份，以备还原
    $scope.comments = [];   //评论我的
    $scope.commenteds = []; //我评论的
    $scope.drafts = [];
    $scope.recycles = [];
    $scope.watcher = $scope.$watch('blogWatch', watchBlog, true);
    $scope.panel = 'blog';
    //分页监听器切换
    $scope.watchSwitch = function(panel){
        if($scope.panel !== panel){
            $scope.watcher();   // 关闭上一个监听器
            $scope.panel = panel;
            //打开下一个监听器
            switch(panel){
                case 'blog': {$scope.watcher = $scope.$watch('blogWatch', watchBlog, true);$http.get('/user/CustomCategory/list')
                    .then(function(success){
                        success = success.data;
                        if(success.success){
                            $scope.customCategoryList = success.data;
                        }else
                            layer.msg(success.msg);
                    });} break;
                case 'customCategory': $scope.watcher = $scope.$watch('watch.customCategory', watchCustomCategory, true); break;
                case 'comments': $scope.watcher = $scope.$watch('watchComment', watchComments, true); break;
                case 'drafts': $scope.watcher = $scope.$watch('watch.drafts', watchDrafts, true); break;
                case 'recycle': $scope.watcher = $scope.$watch('watch.recycle', watchRecycle, true); break;
                case 'collection': $scope.watcher = $scope.$watch('watch.collection', watchCollection, true); break;
                default: break;
            }
        }
    };
    //博客待监听数据
    $scope.blogWatch = {
        page: 1,                 //页数
        category: '全部',         //类别
        customCategory: '全部',    //个人分类
        deleted: 0
    };
    //博客分页参数
    $scope.blogOption = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 5,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.blogOption.curr = page;
            $scope.blogWatch.page = page;
        }
    };
    //监听博客分页
    function watchBlog(blogWatch){
        var url = '/page/blog?page=' + blogWatch.page + '&size=' + $scope.blogOption.count + '&blogger='+$scope.blogger + '&status=-1&visible=true&sort=-updated';
        if(blogWatch.category !== '全部')
            url += '&category=' + blogWatch.category;
        if(blogWatch.customCategory !== '全部')
            url += '&customCategory='+blogWatch.customCategory;
        //请求数据
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.blogOption.all = Math.ceil(success.count / $scope.blogOption.count);
                    $scope.blogs = success.data;
                }else{
                    layer.msg(success.msg)
                }
            });
    }
    //置顶操作
    $scope.setTop = function(index){
        var id = $scope.blogs[index].id;
        if(id){
            $http.get('/user/setTop/blog/'+id)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg('置顶成功');
                        $scope.blogs[index].top = success.data;
                    }
                    else layer.msg(success.msg);
                });
        }
    };
    //取消置顶操作
    $scope.cancelTop = function(index){
        var id = $scope.blogs[index].id;
        if(id){
            $http.get('/user/cancelTop/blog/'+id)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg("取消置顶成功");
                        $scope.blogs[index].top = success.data;
                    }
                    else layer.msg(success.msg);
                })
        }
    };
    //显示操作
    $scope.setShow = function(index){
        var id = $scope.blogs[index].id;
        if(id){
            $http.get('/user/show/blog/'+id)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg(success.msg);
                        $scope.blogs[index].visible = true;
                    }
                    else layer.msg(success.msg);
                })
        }
    };
    //隐藏操作
    $scope.setHide = function(index){
        var id = $scope.blogs[index].id;
        if(id){
            $http.get('/user/hide/blog/'+id)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg(success.msg);
                        $scope.blogs[index].visible = false;
                    }
                    else layer.msg(success.msg);
                })
        }
    };
    //允许评论
    $scope.setReviewable = function(index){
        var id = $scope.blogs[index].id;
        if(id){
            $http.get('/user/reviewable/blog/'+id)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg('允许用户评论该文章');
                        $scope.blogs[index].reviewable = true;
                    }else layer.msg(success.msg);
                });
        }
    };
    //禁止评论
    $scope.setUnreviewable = function(index){
        var id = $scope.blogs[index].id;
        if(id){
            $http.get('/user/unreviewable/blog/'+id)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg('禁止用户评论该文章');
                        $scope.blogs[index].reviewable = false;
                    }else layer.msg(success.msg);
                });
        }
    };
    //删除博客
    $scope.deleteOpt = {
        msg: '是否确认删除',
        title: '删除博客',
        cb: function(id) {
            $http.get('/user/remove/blog/' + id)
                .then(function (success) {
                    success = success.data;
                    if (success.success) {
                        layer.msg(success.data);
                        // 刷新数据操作
                        $scope.blogWatch.deleted ++;
                    } else {
                        layer.msg(success.msg);
                    }
                })
        }
    };
    //待监听数据 - 即所有分页页数
    $scope.watch = {
        collection: {
            curr: 1,
            deleted: 0
        },
        customCategory: {
            curr: 1,
            deleted: 0
        },
        drafts: {
            curr: 1,
            deleted: 0
        },
        recycle: {
            page: 1,
            deleted: 0
        }
    };
    //收藏夹分页参数
    $scope.collectionOption = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 5,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.collectionOption.curr = page;
            $scope.watch.collection = page;
        }
    };
    //监听收藏夹
    function watchCollection(collection){
        var url = "/user/page/blogger?page="+collection.curr+'&size='+$scope.draftsOption.count+'&collections=true';
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.collectionOption.all = Math.ceil(success.count / $scope.collectionOption.count);
                    $scope.collections = success.data;
                }else{
                    layer.msg(success.msg)
                }
            });
    }
    $scope.cancelCollection = function(index){
        var id = $scope.collections[index]._id;
        if(id) {
            $http.get('/user/collected/post/' + id)
                .then(function (success) {
                    success = success.data;
                    if (success.success) {
                        layer.msg(success.data);
                        $scope.watch.collection.deleted ++;
                    } else layer.msg(success.msg);
                });
        }
    };
    //个人分类分页参数
    $scope.customCategoryOption = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 5,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.customCategoryOption.curr = page;
            $scope.watch.customCategory.curr = page;
        }
    };
    function watchCustomCategory(customCategory){
        var url = "/user/page/customCategory?page="+customCategory.curr+'&size='+$scope.customCategoryOption.count;
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.customCategoryOption.all = Math.ceil(success.count / $scope.customCategoryOption.count);
                    $scope.customCategorys = success.data;
                    for(var index in $scope.customCategorys)
                        $scope.copyCustomCategorys.push($scope.customCategorys[index].name);
                }else{
                    layer.msg(success.msg)
                }
            });
    }
    $scope.newCustomCategoryName = '';
    $scope.addCustomCategory = function(){
        var name = $scope.newCustomCategoryName;
        if(name){
            $http.get('/user/add/customCategory/'+name)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg('分类添加成功');
                        $scope.newCustomCategoryName = '';
                        $scope.watch.customCategory.deleted ++;
                    }
                    else layer.msg(success.msg);
                });
        }
    };
    $scope.editCustomCategory = function(index){
        var category = $scope.customCategorys[index];
        var oldName = $scope.copyCustomCategorys[index];
        if(category){
            if(category.name && category.name !== oldName)
                $http.get('/user/edit/customCategory/'+category._id+'?name='+category.name)
                    .then(function(success){
                        success = success.data;
                        if(success.success){
                            layer.msg('分类修改成功');
                            $scope.customCategorys[index].name = success.data;
                            $scope.copyCustomCategorys[index] = success.data;
                        }
                        else {
                            layer.msg(success.msg);
                            $scope.customCategorys[index].name = oldName;
                        }
                    });
            else
                $scope.customCategorys[index].name = oldName;
        }
    };
    $scope.removeCustomCategory = function(index){
        var category = $scope.customCategorys[index];
        if(category){
            $http.get('/user/remove/customCategory/'+category._id)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg('分类删除成功');
                        $scope.watch.customCategory.deleted ++;
                    }
                    else layer.msg(success.msg);
                });
        }
    };
    //草稿箱分页参数
    $scope.draftsOption = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 5,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.draftsOption.curr = page;
            $scope.watch.drafts.curr = page;
        }
    };
    function watchDrafts(drafts){
        var url = '/page/blog?page='+drafts.curr+'&size='+$scope.draftsOption.count+'&status=0'+'&visible=true';
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.draftsOption.all = Math.ceil(success.count / $scope.draftsOption.count);
                    $scope.drafts = success.data;
                }else{
                    layer.msg(success.msg)
                }
            });
    }
    $scope.deleteBlog = function(index){
        var id = $scope.drafts[index].id;
        if(id)
        $http.get('/user/remove/blog/' + id)
            .then(function (success) {
                success = success.data;
                if (success.success) {
                    layer.msg(success.data);
                    $scope.watch.drafts.deleted ++;
                } else {
                    layer.msg(success.msg);
                }
            })
    };
    //回收站分页参数
    $scope.recycleOption = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 5,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.recycleOption.curr = page;
            $scope.watch.recycle.curr = page;
        }
    };
    function watchRecycle(recycle){
        var url = '/page/blog?page='+recycle.curr+'&size='+$scope.recycleOption.count+'&status=4'+'&visible=true';
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.recycleOption.all = Math.ceil(success.count / $scope.recycleOption.count);
                    $scope.recycles = success.data;
                }else{
                    layer.msg(success.msg)
                }
            });
    }
    $scope.returnBlog = function(index){
        var id = $scope.recycles[index].id;
        if(id){
            $http.get('/user/return/blog/'+id)
                .then(function(success){
                    success = success.data;
                    if(success.success){
                        layer.msg(success.data);
                        $scope.watch.recycle.deleted ++;
                    }else layer.msg(success.msg);
                });
        }
    };
    $scope.destroyBlog = function(index){
        var id = $scope.recycles[index].id;
        if(id) {
            $http.get('/user/destroy/blog/' + id)
                .then(function (success) {
                    success = success.data;
                    if (success.success) {
                        layer.msg(success.data);
                        $scope.watch.recycle.deleted++;
                    } else layer.msg(success.msg);
                });
        }
    };
    //评论监听
    $scope.watchComment = {
        commented: 1,   // 我评论的
        switcher: true   // true-我评论的， false-评论我的
    };
    $scope.countComment = {
        commented: 0,
        comment: 0
    };
    //我评论的
    $scope.switchComment = function(){
        $scope.watchComment = {
            comment: 1,
            switcher: false
        }
    };
    //评论我的
    $scope.switchCommented = function(){
        $scope.watchComment = {
            commented: 1,
            switcher: true
        }
    };
    //评论分页参数
    $scope.commentOption = {
        curr: 1,  //当前页数
        all: 1,  //总页数
        count: 5,  //最多显示的页数，默认为5
        //点击页数的回调函数，参数page为点击的页数
        click: function (page) {
            $scope.commentOption.curr = page;
            if($scope.switcher)
                $scope.watchComment.commented = page;
            else
                $scope.watchComment.comment = page;
        }
    };
    function watchComments(comment){
        var page = comment.switcher ? comment.commented : comment.comment;
        var url = "/user/page/comment?page="+page+'&size='+$scope.commentOption.count;
        if(comment.switcher)
            url += '&publisher=true';
        else
            url += '&blogger=true';
        $http.get(url)
            .then(function(success){
                success = success.data;
                if(success.success){
                    $scope.commentOption.all = Math.ceil(success.count / $scope.commentOption.count);
                    if(comment.switcher){
                        $scope.commenteds = success.data;
                        $scope.countComment.commented = success.count;
                    }
                    else{
                        $scope.comments = success.data;
                        $scope.countComment.comment = success.count;
                    }
                }else{
                    layer.msg(success.msg)
                }
            });
    }
}]);

//修改密码页面控制器
app.controller('ChangePasswordCtrl', ['$scope', '$http', 'SessionUser', function($scope, $http, SessionUser){
    $scope.password = {
        oldPassword: '',
        newPassword: '',
        password2: ''
    };
    //提交修改
    $scope.submit = function(){
        console.log('submit');
        $http.post('/user/change/password', $scope.password)
            .then(function(success){
                success = success.data;
                if(success.success){
                    layer.msg(success.msg);
                    SessionUser.quit();
                    window.location.href = '/quit';
                }
                else layer.msg(success.msg);
            });
    }
}]);

//意见反馈控制器
app.controller('FeedbackCtrl', ['$scope', '$http', function($scope, $http){
    $scope.feedback = {
        types: [],
        suggest: ''
    };
    $scope.wordsLimit = 100;
    $scope.checkSpan = function(e){
        $target = angular.element(e.target);
        $target.toggleClass('checked');
    };
    $scope.editSuggest = function(){
        if($scope.feedback.suggest.length > 100){
            $scope.feedback.suggest = $scope.feedback.suggest.substring(0, 100);
        }
        $scope.wordsLimit = 100 - $scope.feedback.suggest.length;
    };
    $scope.submit = function(){
        $spans = angular.element('span.span-type.checked');
        var types = [];
        $spans.each(function(index, ele){
            $ele = angular.element(ele);
            types.push($ele.text())
        });
        var strContent = $scope.feedback.suggest;
        strContent = strContent.replace(/\r\n/g, '<br/>'); //IE9、FF、chrome
        strContent = strContent.replace(/\n/g, '<br/>'); //IE7-8
        strContent = strContent.replace(/\s/g, ' '); //空格处理
        $http.post('/user/feedback', {
            types: types,
            suggest: strContent
        })
            .then(function(data){
                data = data.data;
                if(data.success){
                    location.href = '/info/feedback-success';
                }else{
                    layer.msg(data.msg);
                }
            });
    }
}]);