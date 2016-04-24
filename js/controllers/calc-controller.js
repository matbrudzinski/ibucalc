/**
 * Created by Pixellence on 2016-04-21.
 */

angular.module('ibuCalc', ["ngMaterial"]).controller('calcCtrl', function ($scope, $timeout, $q, $log) {

    $scope.hopList = [];
    $scope.ibu = 0;

    $scope.boilTimeInput = "";
    $scope.hopNameAuto = "";
    $scope.hopTypeSelect = "Pellet";
    $scope.hopAcidsInput = "";
    $scope.hopWeightInput = "";

    $scope.boilSizeInput = 23;
    $scope.batchSizeInput = 20;
    $scope.targetGravityInput = 1.048;

    $scope.boilGravity = 0;

    //IBU calculation
    //bigness factor
    var bigness = function (gravity) {
        return 1.65 * Math.pow(0.000125, (gravity));
    }

    //boiltime factor
    var btf = function (minutes) {
        return (1 - Math.pow(Math.E, (-0.04 * minutes))) / 4.15;
    }

    //alpha acids utilization
    var utilization = function (minutes, gravity, type) {
        return btf(minutes) * bigness(gravity) * type;
    }

    //alpha acids units
    var aau = function (g, aa, volume) {
        return (aa * 0.01 * g * 1000) / volume;
    }

    //part IBU calculation
    var calculatePartIbu = function (g, minutes, aa, volume, gravity, type) {
        return utilization(minutes, gravity, type) * aau(g, aa, volume);
    }

    //total IBU calculation
    $scope.calculateIbu = function () {

        //Boil gravity estimation
        var gravity = ($scope.batchSizeInput / $scope.boilSizeInput) * ($scope.targetGravityInput - 1);
        $scope.boilGravity = Math.round((gravity + 1) * 1000) / 1000;

        //part IBU calculation
        var totalIbu = 0;

        for (var i = 0; i < $scope.hopList.length; i++) {

            //Pelet 10% adjustment
            if ($scope.hopList[i].hopType === "Pellet") var type = 1.1;
            else var type = 1;

            totalIbu += calculatePartIbu($scope.hopList[i].hopWeight, $scope.hopList[i].boilTime, $scope.hopList[i].hopAcids, $scope.batchSizeInput, gravity, type);

            //Getting hoppying impact from boiling time
            var time = $scope.hopList[i].boilTime;
            var impact = $scope.hopList[i].hopFor;

            if (time > 30 && impact !== "Bitterness") {
                impact = "Bitterness";
            }
            else if (time > 10 && time <= 30 && impact !== "Taste") {
                impact = "Taste";
            }
            else if (time <= 10 && impact !== "Aroma") {
                impact = "Aroma";
            }
            $scope.hopList[i].hopFor = impact;
        }

        $scope.ibu = Math.round(totalIbu*10)/10;
    }

    //adding hops to scope
    $scope.hopAdd = function () {

        $scope.hopList.push({
            boilTime: $scope.boilTimeInput,
            hopName: $scope.hopNameAuto,
            hopType: $scope.hopTypeSelect,
            hopAcids: $scope.hopAcidsInput,
            hopWeight: $scope.hopWeightInput,
            hopFor: $scope.hopFor
        });

        //reset inputs
        self.selectedItem = null;
        self.searchText = "";
        $scope.boilTimeInput = "";
        $scope.hopNameInput = "";
        $scope.hopTypeSelect = "Pellet";
        $scope.hopAcidsInput = "";
        $scope.hopWeightInput = "";
        $scope.calculateIbu();
    };

    //remove from hop list
    $scope.remove = function (item) {
        var index = $scope.hopList.indexOf(item);
        $scope.hopList.splice(index, 1);
    }

    //reset form
    $scope.reset = function () {
        $scope.hopList = []
        $scope.ibu = 0;
    }

    /*Angular Material - Autocomplete*/
    var self = this;
    self.simulateQuery = false;
    self.isDisabled = false;
    self.hops = loadAll();
    self.querySearch = querySearch;
    self.selectedItemChange = selectedItemChange;
    self.searchTextChange = searchTextChange;

    function querySearch(query) {
        var results = query ? self.hops.filter(createFilterFor(query)) : self.hops,
            deferred;
        if (self.simulateQuery) {
            deferred = $q.defer();
            $timeout(function () {
                deferred.resolve(results);
            }, Math.random() * 1000, false);
            return deferred.promise;
        } else {
            return results;
        }
    }

    function searchTextChange(text) {
        $scope.hopNameAuto = text;
    }

    function selectedItemChange(item) {
        if (item !== undefined && item !== null) {
            $scope.hopAcidsInput = item.aa;
            $scope.hopNameAuto = item.name;
        }
    }

    function loadAll() {
        var hops = [
            {
                'name': 'Amarillo',
                'type': 'Universal',
                'aa': 9.2,
                'country': 'USA'
            },
            {
                'name': 'Citra',
                'type': 'Universal',
                'aa': 13.5,
                'country': 'USA'
            },
            {
                'name': 'Cenntenial',
                'type': 'Aromatic',
                'aa': 10.8,
                'country': 'USA'
            },
            {
                'name': 'Chinook',
                'type': 'Universal',
                'aa': 12.8,
                'country': 'USA'
            },
            {
                'name': 'Marynka',
                'type': 'Bittering',
                'aa': 2.1,
                'country': 'Poland'
            }
        ];
        return hops.map(function (hop) {
            hop.value = hop.name.toLowerCase();
            return hop;
        });
    }

    function createFilterFor(query) {
        var lowercaseQuery = angular.lowercase(query);
        return function filterFn(item) {
            return (item.value.indexOf(lowercaseQuery) === 0);
        };
    }

});