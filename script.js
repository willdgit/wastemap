
document.getElementById("geolocate").onclick = function () {
    navigator.geolocation.getCurrentPosition(showPositionOnMap);
}


var markers = [];
//add all markers from the geojson file onto the map and into the markers array
function addMarkers() {
    var new_icon;
    for (let i = 0; i < waste.length; i++) {
        if (waste[i].CATEGORY == "Community Recycling Centre") {
            new_icon = "http://maps.google.com/mapfiles/ms/micons/recycle.png";
        }
        else if (waste[i].CATEGORY == "Resource Recovery Centre") {
            new_icon = "http://maps.google.com/mapfiles/kml/paddle/pink-blank.png";
        }
        else if (waste[i].CATEGORY == "Landfill Site") {
            new_icon = "garbage.png";
        }

        marker = new google.maps.Marker({
            position: {
                lat: parseFloat(waste[i].LATITUDE),
                lng: parseFloat(waste[i].LONGITUDE)
            },
            title: waste[i].NAME,
            icon: new_icon
        });
        // put the marker onto the map (it will not appear otherwise)
        marker.setMap(map);

        //store properties of each location as properties of the marker object
        marker.NAME = waste[i].NAME;
        marker.CATEGORY = waste[i].CATEGORY;
        marker.LATLNG = new google.maps.LatLng(waste[i].LATITUDE, waste[i].LONGITUDE);
        //set the markers content string
        marker.CONTENT = "<h6>" + marker.NAME + "</h6><p>" + marker.CATEGORY + "</p>";

        //add the click listener
        marker.addListener('click', marker_click)

        markers.push(marker);
    }
}

//only display markers of 'type', setMap all others to null
function filterMarkers(type) {
    for (let i = 0; i < markers.length; i++) {
        if (type == "SHOWALL") {
            markers[i].setMap(map);
        }
        else if (markers[i].CATEGORY == type) {
            markers[i].setMap(map);
        }
        else {
            markers[i].setMap(null);
        }
    }
}

//keep track of user position and destination position
var user_position;
var dest_position;

//send a directionRender request using the position and destination params
function showDirections(position, destination) {
    if (destination == null) {
        $("#exampleModal").modal("show");
    }



    //if method is passed a GeoPosition, 
    if (position instanceof GeolocationPosition) {
        //make a LatLng from its coords (direction request can't use a GeoPosition)
        position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    }

    //else we can use position as-is
    request = {
        origin: position,
        destination: destination,
        travelMode: method
    };

    //send the direction request
    directionsService.route(request, function (result, status) {
        if (status == 'OK') {
            //update view
            directionPanel.style.width = '405px';
            directionPanel.style.display = 'block';
            closeButton.style.display = 'inline-block';
            //update for mobile
            if (window.innerWidth > 800) {
                document.getElementById("map").style.marginLeft = '5%';
            }
            //render the directions, update the panel
            directionsRenderer.setDirections(result);
            directionsRenderer.setPanel(directionPanel);
            console.log(result);
        }
    });
}

var toggle = false;
var method = 'DRIVING';
//toggle between driving and walking directions
function toggleMode() {
    if (!toggle) {
        toggle = true;
        method = 'WALKING';
        document.getElementById("toggleMode").innerHTML = "Toggle Walking";
    } else {
        toggle = false;
        method = 'DRIVING';
        document.getElementById("toggleMode").innerHTML = "Toggle Driving";
    }
}

var marked = false;//keep track if the user has marked their location already
//geolocate the user and place a marker on their position, based on position var
function showPositionOnMap(position) {



    //if user has been marked, unset it before we add another
    if (marked) {
        user_marker.setMap(null);
    }

    //update the user's position with the geo-located position param
    user_position = position;

    // create a marker centered at the user's location
    user_marker = new google.maps.Marker({
        position: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        },
        title: "Your Location",
        icon: "http://maps.google.com/mapfiles/kml/pal4/icon28.png"
    });

    //center the map at users' position
    map.setCenter(user_marker.position);
    //set the marker
    user_marker.setMap(map);
    marked = true;
}

//geocode the entered address
function codeAddress() {
    if (marked) {
        user_marker.setMap(null);
    }

    var address = document.getElementById('geoaddress').value;

    // perform geocoding for the address entered into the input textbox, a 
    // callback function is given the latitude and longitude as an an 
    // argument as part of a results object..
    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status == 'OK') {

            // we could center the map at the location
            map.setCenter(results[0].geometry.location);

            // put a marker on the map at the given position
            user_marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location,
                icon: "http://maps.google.com/mapfiles/kml/pal4/icon28.png"
            });

            //set the users position to the geocoded location
            user_position = user_marker.position;
            marked = true;
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}

var map;
var geocoder;
//get a refrence to the display panel and the close button
var directionPanel = document.getElementById("directionPanel");
var closeButton = document.getElementById("closeDirPanel");

function initMap() {
    //create the map
    map = new google.maps.Map(document.getElementById("map"), {
        center: {
            lat: 43.2387,
            lng: -79.841
        },
        zoom: 12,
    });
    //setup services/features
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    geocoder = new google.maps.Geocoder();
    infowindow = new google.maps.InfoWindow();

    //open the infowindow with the clicked marker's content
    marker_click = function () {
        infowindow.close();
        infowindow.setContent(this.CONTENT);
        infowindow.open(map, this);
        //set the direction destination to this marker
        dest_position = this.LATLNG;
    }
    //when user clicks "to Selected Marker" option
    document.getElementById("showDirections").addEventListener('click', function () {
        //show the directions with the stored positions
        showDirections(user_position, dest_position);
    });
    //close the directions panel when the button is clicked
    closeButton.addEventListener('click', function () {
        closeButton.style.display = 'none';
        directionPanel.style.display = 'none';
        //update for mobile
        if (window.innerWidth > 800) {
            document.getElementById("map").style.marginLeft = '15%';
        }
    });

    addMarkers();
}

