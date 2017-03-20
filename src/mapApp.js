var ko = require('knockout');
var PhotoSwipe = require('photoswipe');
var PhotoSwipeUI_Default = require('photoswipe/dist/photoswipe-ui-default.js');

module.exports = (function (window) {
  'use strict';

  var map;
  var places;
  var infoWindow;
  var markers = [];
  var autocomplete;
  var photoSwipeCollection;
  var restaurantViewModel;
  var RestaurantViewModel = function () {
    this.contentVisible = ko.observable(false);
    this.name = ko.observable();
    this.phone = ko.observable();
    this.address = ko.observable();
    this.website = ko.observable();
    this.thumbnails = ko.observableArray();
    this.restaurantResults = ko.observableArray();
    this.enlargedPhotos = ko.observableArray();
  }

  /*  Centres map on the clicked restaurant's respective marker
      and opens that restaurant's info window  */
  RestaurantViewModel.prototype.goToMarker = function(clickedRestaurant) {
    map.panTo(clickedRestaurant.position);
    google.maps.event.trigger(clickedRestaurant.marker, 'click', showInfoWindow);
  };

  /*  Initializes and opens the PhotoSwipe window  */
  RestaurantViewModel.prototype.openPhotoSwipe = function (index) {
    var clickedGallery = document.getElementById('photos');
    var pswpElement = document.querySelectorAll('.pswp')[0];
    var options = {
      showAnimationDuration: 333,
      hideAnimationDuration: 333,
      index: index,
      preload: [1, 3],
      focus: true
    };
    var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, photoSwipeCollection, options);
    gallery.init();
  }

  window.onload = loadMapAPI;

  // dynamically adds script tag to the HTML, allowing for asynchronous loading
  function loadMapAPI() {
    var script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDr6MNUWILJ14oOkpOH6LMlEz-cMW3aJ60&callback=initialize&libraries=places';
    document.body.appendChild(script);
  }

  // initialization code
  window.initialize = function() {
    var mapOptions = {
      zoom: 16,
      center: new google.maps.LatLng(-37.8389, 144.9922)
    };
    var searchInput = document.getElementById('autocomplete');
    var autocompleteOptions = {
      componentRestrictions: {country: 'au'}
    };

    map = new google.maps.Map(document.getElementById('map'), mapOptions);

    infoWindow = new google.maps.InfoWindow({
      content: document.getElementById('info-content')
    });

    autocomplete = new google.maps.places.Autocomplete(searchInput, autocompleteOptions);
    
    google.maps.event.addDomListener(window, "resize", function() {
      var center = map.getCenter();
      google.maps.event.trigger(map, "resize");
      map.setCenter(center);
    });

    google.maps.event.addListener(autocomplete, 'place_changed', onPlaceChanged);
    places = new google.maps.places.PlacesService(map);

    restaurantViewModel = new RestaurantViewModel();
    ko.applyBindings(restaurantViewModel);
    
    searchRestaurants();
  }

  function onPlaceChanged() {
    var place = autocomplete.getPlace();

    if (place.geometry) {
      reset();
      map.panTo(place.geometry.location);
      map.setZoom(16);
      searchRestaurants();
    } else {
      document.getElementById('autocomplete').placeholder = 'Enter a city';
      return;
    }
  }

  function reset() {
    clearRestaurantList();
    clearMarkers();
    infoWindow.close();
  }

  function clearRestaurantList() {
    var restaurantList = document.getElementById('menu');
    var restaurants = document.getElementsByClassName('restaurant');
    while (restaurants[0]) {
       restaurantList.removeChild(restaurants[0]);
    }
  }

  function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
      if (markers[i]) {
        markers[i].setMap(null);
      }
    }
    markers = [];
    restaurantViewModel.restaurantResults([]);
  }

  function processRequest(results, status, pagination) {
    var restaurantList = document.getElementById('menu')
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0, len = results.length; i < len; i++) {
        
        // create marker for each restaurant
        markers[i] = new google.maps.Marker({
          position: results[i].geometry.location,
          map: map
        });

        // populate restaurantResults observable array with restaurant results
        restaurantViewModel.restaurantResults.push({
          name: results[i].name,
          position: markers[i].position,
          marker: markers[i],
          address: results[i].vicinity
        });

        markers[i].placeResult = results[i];
        google.maps.event.addListener(markers[i], 'click', showInfoWindow);
      }

      // retrieve more results (if any) when user scrolls to bottom of menu
      if (pagination.hasNextPage) {
        restaurantList.onscroll = function () {
          if ((restaurantList.scrollTop + restaurantList.offsetHeight + 1) > restaurantList.scrollHeight) {
            pagination.nextPage();
          }
        };
      }
    }
  }

  function searchRestaurants() {
    var placesSearchRequest = {
      location: map.getCenter(),
      radius: 400,
      type: ['restaurant']
    };

    places.nearbySearch(placesSearchRequest, processRequest);
  }

  /*  opens InfoWindow  */
  function showInfoWindow() {
    var marker = this;
    
    map.panTo(marker.position);
    places.getDetails({
      placeId: marker.placeResult.place_id 
    }, function(place, status) {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        return;
      }
      setContent(place);
      buildPhotoSwipeGallery(place);
    });

    infoWindow.open(map, marker);
  }

  /*  Updates current restaurant's ViewModel  */
  function setContent(place) {
    var photos = place.photos;
    restaurantViewModel.contentVisible(true)
    restaurantViewModel.name(place.name);
    restaurantViewModel.phone('Phone: ' + place.formatted_phone_number);
    if(place.formatted_phone_number == null) {
      restaurantViewModel.phone("");
    }
    restaurantViewModel.address('Address: ' + place.vicinity);
    restaurantViewModel.website(trimWebsite(place.website));
    if(place.website == null) {
      restaurantViewModel.website("");
    }
    restaurantViewModel.thumbnails([]);
    photos.forEach(function (photo) {
      restaurantViewModel.thumbnails.push(photo.getUrl({
        'maxHeight': 200
      }));
    });
  }

  /*  Return domain name of website  */
  function trimWebsite(website) {
    return website.match(/http:\/\/[^\/]*/);
  }

  /*  Build PhotoSwipe gallery  */
  function buildPhotoSwipeGallery(place) {
    var photos = place.photos;
    photoSwipeCollection = [];

    photos.forEach(function (photo) {
      var slideObject = {
        src: photo.getUrl({
          'maxHeight': 800,
          'maxWidth': 800
        }),
        w: photo.width,
        h: photo.height
      };
      
      photoSwipeCollection.push(slideObject);
    });
  }
}(window));
