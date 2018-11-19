'use strict';

app.controller('PostListCtrl', function($scope, $resource, $stateParams, $modal, $state, pagination){
    $scope.query = function(page, filter){
        var $com = $resource($scope.app.host + '/post?page=:page&search=:filter', {
            page: '@page',
            filter: '@filter'
        });
        page = parseInt(page) || 1;
        $com.get({page: page, filter: filter}, function(data){
            pagination.pages(data, page);
            $scope.data = data;
            $scope.search_context = filter;
        });
    };
    $scope.search = function(){
        $state.go('app.post.list', {search: $scope.search_text});
    };
    var selected = false;
    $scope.selectAll = function() {
        selected = !selected;
        angular.forEach($scope.data.results, function (item) {
            item.selected = selected;
        });
    };
    $scope.exec = function(){
        if($scope.operate === '1'){
            var ids = [];
            angular.forEach($scope.data.results, function(item){
                if(item.selected)
                    ids.push(item.id);
            });
            if(ids.length > 0){
                var modalInstance = $modal.open({
                    templateUrl: '/admin/confirm.html',
                    controller: 'ConfirmCtrl',
                    size: 'sm'
                });
                modalInstance.result.then(function(){
                    var $com = $resource($scope.app.host + '/post/delete/?');
                    $com.delete({ids: ids.join(',')}, function(){
                        $state.go('app.post.list');
                    });
                });
            }
        }
    };
    $scope.query($stateParams.page, $stateParams.search);
});

app.controller('PostCtrl', function($rootScope, $scope, $stateParams, $resource){
    var $com = $resource($scope.app.host+'/detail/post/:id/?', {id: '@id'});
    $scope.post = {};
    $com.get({id: $stateParams.id}, function(data){
        if(data.success) $scope.post = data.post;
    });
    var $com2 = $resource($scope.app.host+'/comments/post/:id/?', {id: '@id'});
    $scope.comments = [];
    $com2.get({id: $stateParams._id}, function(data){
        console.log(data);
        if(data.success) $scope.comments = data.comments;
    });
});