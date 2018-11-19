
var services = angular.module('BlogApp.services', ['BlogApp.configs']);

//暂存要回复的对象的信息
services.factory('Comment', function(){
    var service = {
        reply: '',      //回复对象ID
        name: '',       //回复对象昵称
        group: '',      //回复的分组

        replied: function(id, name, group){     //回复操作
            service.reply = id;
            service.name = name;
            service.group = group;
        },

        compare: function(name){                //对比操作
            if(name === service.name)
                return {
                    blogger: service.reply,
                    group: service.group
                };
            else
                return ''
        }
    };
    return service;
});

// 用户Session - 基于localStorage实现
services.factory('SessionUser', ['$cookies', function($cookies){
    var flag = true;
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 1);   //一天后过期
    if(window.Storage && window.localStorage && window.localStorage instanceof Storage)
        flag = false;
    return {
        logged: function(redirect){ //redirect - 控制是否需要跳转至登录页 (true)
            var user = flag ? localStorage.getItem('user') : $cookies.get('user');
            if(!user){
                if(!redirect)
                    layer.alert('用户还未登录, 请前往登录', {title: '提示信息'}, function(){
                        window.location.href = '/login';
                    });
                return false;
            }else{
                return true;
            }
        },
        getUser: function(){
            return flag ? localStorage.getItem('user') : $cookies.get('user');
        },
        login: function(user){
            if(flag)
                localStorage.setItem('user', user);
            else
                $cookies.put('user', user, {'expires': expireDate});
        },
        quit: function(){
            if(flag)
                localStorage.removeItem('user');
            else
                $cookies.remove('user');
        }
    }
}]);
