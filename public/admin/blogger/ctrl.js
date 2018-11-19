'use strict';

app.controller('BloggerListCtrl', function($scope, $resource, $stateParams, $modal, $state, pagination){
   $scope.query = function(page, filter){
       var $com = $resource($scope.app.host + '/blogger?page=:page&search=:filter', {
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
       $state.go('app.blogger.list', {search: $scope.search_text});
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
                   var $com = $resource($scope.app.host + '/blogger/delete/?');
                   $com.delete({ids: ids.join(',')}, function(){
                       $state.go('app.blogger.list');
                   });
               });
           }
       }
   };
   $scope.query($stateParams.page, $stateParams.search);
});

app.controller('ConfirmCtrl', function($scope){

});

app.controller('BloggerCtrl', function($rootScope, $scope, $stateParams, $resource, $state){
    var $com = $resource($scope.app.host+'/detail/blogger/:id/?', {id: '@id'});
    $scope.blogger = {};
    $com.get({id: $stateParams.id}, function(data){
        console.log(data);
        if(data.success) $scope.blogger = data.blogger;
    });
});