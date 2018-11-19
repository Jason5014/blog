'use strict';

app.controller('CategoryListCtrl', function($scope, $resource, $stateParams, $modal, $state, pagination){
   $scope.query = function(page, filter){
       var $com = $resource($scope.app.host + '/category?page=:page&search=:filter', {
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
       $state.go('app.category.list', {search: $scope.search_text});
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
                   var $com = $resource($scope.app.host + '/category/delete/?');
                   $com.delete({ids: ids.join(',')}, function(){
                       $state.go('app.category.list');
                   });
               });
           }
       }
   };
   $scope.query($stateParams.page, $stateParams.search);

   $scope.add = function(){
       $modal.open({
           templateUrl: '/admin/addCategory.html',
           controller: 'AddCategoryCtrl'
       });
   }
});

app.controller('AddCategoryCtrl', function($scope, $resource, $state, $modalInstance){
    $scope.name = '';
    $scope.ok = function(){
        if($scope.name){
            var $com = $resource('/admin/add/category/:name/?');
            $com.get({name: $scope.name}, function(data){
                if(data.success){
                    $state.go('app.category.list');
                    $modalInstance.close();
                }
                else{
                    alert(data.msg);
                }
            });
        }
        else alert('名称不为空');
    };
    $scope.cancel = function(){
        $modalInstance.dismiss('cancel');
    };
});

