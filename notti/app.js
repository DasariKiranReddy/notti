var r=g=b=255;
var app;
(function(){
  app = angular.module('notti', ['ngMaterial','mdColorPicker'])
  .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('blue')
      .accentPalette('pink');
    $mdThemingProvider.theme('success-toast');
    $mdThemingProvider.theme('error-toast');
    
    $mdThemingProvider.alwaysWatchTheme(true);
  })  
})();

app.controller('mainController', function($scope, $mdToast){

    $scope.notti = notti;
    $scope.Custom = true;

    $scope.notti.onSuccess = function(message){
        $mdToast.show(
          $mdToast.simple()
            .content(message)
            .position('top right')
            .hideDelay(2500)
            .theme("success-toast")
        );
    };

    $scope.notti.onError = function(message){
        $mdToast.show(
          $mdToast.simple()
            .content(message)
            .position('top right')
            .hideDelay(2500)
            .theme("error-toast")
        );
    };

    $scope.scopeVariable = {};

  //   $scope.scopeVariable.options = {
  //     label: "Choose a color",
  //     icon: "brush",
  //     default: "#f00",
  //     genericPalette: false,
  //     history: false
  // };

    $scope.$watch(function(scope) {
     return scope.scopeVariable.color },
      function(newValue, oldValue) {
      console.log(newValue);
      var rgb={};
        rgb = $scope.tinycolor.inputToRGB(newValue);
        r=rgb.r;
        g=rgb.g;
        b=rgb.b;
        console.log(r);

        $scope.notti.RGB(r,g,b);
      });
    

    $scope.toggleNottiLight = function() {
      if($scope.notti.isOn==false){
        $scope.Custom = true;
      }
        $scope.notti.toggleNottiLight($scope.notti.isOn);
    };
    $scope.RGB = function(){
      $scope.Custom = false;
    };
    $scope.colourChange = function(){
      $scope.notti.colourChange($scope.notti.colourChange);
    };


    $scope.connectClick = function(){
        if (navigator.bluetooth == undefined) {
            console.log("No navigator.bluetooth found.");
            $scope.notti.onError("No navigator.bluetooth found.");
        } else {
          $scope.notti.onSuccess('Connecting ....');
            // if (navigator.bluetooth.referringDevice) {
                notti.connect()
                  .then(() => {
                    return  setLightSwitch();
                  })
                  .catch(error => {
                    // TODO: Replace with toast when snackbar lands.
                    console.error('Argh!', error);
                  });
            // }
        }
        screen.orientation.lock('portrait').catch(e => e);
    };


    function setLightSwitch() {
        smartLight.isOn = true;
      }
});