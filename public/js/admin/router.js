app.run(
        function ($rootScope,   $state,   $stateParams,$localStorage,$http) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $localStorage.auth;
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            $rootScope.$on('$stateChangeSuccess', function(event, to, toParams, from, fromParams) {
                $rootScope.previousState = from;
                $rootScope.previousStateParams = fromParams;
            });
        }
    )
    .config(
        function ($stateProvider,   $urlRouterProvider) {
            $urlRouterProvider
                .otherwise('/auth/loading');
            $stateProvider
                .state('auth',{
                    abstract: true,
                    url:'/auth',
                    template: '<div ui-view class="fade-in"></div>',
                    resolve: {
                        deps: ['$ocLazyLoad',
                            function( $ocLazyLoad ){
                                return $ocLazyLoad.load('/admin/auth/ctrl.js');
                            }]
                    }
                })
                .state('auth.loading',{
                    url:'/loading',
                    templateUrl:'/admin/auth/loading.html',
                })
                .state('auth.login',{
                    url:'/login',
                    templateUrl:'/admin/auth/login.html',
                })

                .state('app', {
                    abstract: true,
                    url: '/app',
                    templateUrl: '/admin/app.html',
                })
                .state('app.dashboard', {
                    url: '/dashboard',
                    templateUrl: '/admin/dashboard.html',
                    ncyBreadcrumb: {
                        label: '<i class="fa fa-home"></i> 首页'
                    }
                })
                .state('app.blogger', {
                    abstract: true,
                    url: '/blogger',
                    template: '<div ui-view class="fate-in"></div>',
                    resolve: {
                        deps: ['$ocLazyLoad',
                            function($ocLazyLoad){
                            return $ocLazyLoad.load('/admin/blogger/ctrl.js')
                            }
                        ]
                    }
                })
                .state('app.blogger.list', {
                    url: '/list?page&search',
                    templateUrl: '/admin/blogger/list.html',
                    ncyBreadcrumb: {
                        parent: 'app.dashboard',
                        label: '博主列表'
                    }
                })
                .state('app.blogger.detail', {
                    url: '/detail/{id}',
                    templateUrl: '/admin/blogger/detail.html',
                    ncyBreadcrumb: {
                        parent: 'app.blogger.list',
                        label: '查看'
                    }
                })
                .state('app.post', {
                    abstract: true,
                    url: '/post',
                    template: '<div ui-view class="fade-in"></div>',
                    resolve: {
                        deps: ['$ocLazyLoad', function($ocLazyLoad){
                            return $ocLazyLoad.load('/admin/post/ctrl.js')
                        }]
                    }
                })
                .state('app.post.list', {
                    url: '/list?page&search',
                    templateUrl: '/admin/post/list.html',
                    ncyBreadcrumb: {
                        parent: 'app.dashboard',
                        label: '文章列表'
                    }
                })
                .state('app.post.detail', {
                    url: '/detail/{id}&{_id}',
                    templateUrl: '/admin/post/detail.html',
                    ncyBreadcrumb: {
                        parent: 'app.post.list',
                        label: '查看'
                    }
                })
                .state('app.category', {
                    abstract: true,
                    url: '/category',
                    template: '<div ui-view class="fade-in"></div>',
                    resolve: {
                        deps: ['$ocLazyLoad', function($ocLazyLoad){
                            return $ocLazyLoad.load('/admin/category/ctrl.js')
                        }]
                    }
                })
                .state('app.category.list', {
                    url: '/list?page&search',
                    templateUrl: '/admin/category/list.html',
                    ncyBreadcrumb: {
                        parent: 'app.dashboard',
                        label: '分类列表'
                    }
                })
                .state('app.suggest', {
                    abstract: true,
                    url: '/suggest',
                    template: '<div ui-view class="fade-in"></div>',
                    resolve: {
                        deps: ['$ocLazyLoad', function($ocLazyLoad){
                            return $ocLazyLoad.load('/admin/suggest/ctrl.js')
                        }]
                    }
                })
                .state('app.suggest.list', {
                    url: '/list?page&search',
                    templateUrl: '/admin/suggest/list.html',
                    ncyBreadcrumb: {
                        parent: 'app.dashboard',
                        label: '意见反馈列表'
                    }
                })
                .state('app.suggest.detail', {
                    url: '/detail/{id}',
                    templateUrl: '/admin/suggest/detail.html',
                    ncyBreadcrumb: {
                        parent: 'app.suggest.list',
                        label: '意见反馈详情'
                    }
                })
        }
    );

app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
});
app.factory('AuthInterceptor', function ($rootScope, $q,$location) {
    return {
        responseError: function (response) {
            if(response.status === 401)
            {
                $location.url('/auth/login');
            }
            return $q.reject(response);
        }
    };
});