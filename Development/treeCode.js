<script>

// hide GQ Fields
$(document).ready(function () {


	// check window is loaded meaning all external assets like images, css, js, etc
	$(window).on("load", function () {
		$("input[id^=GQ]").parent().hide();
                 $(".pac-card").show();
                 $("#map").show();


	});
});

function initMap() {

	if (document.getElementById('map') == null) {
		setTimeout(function () {
			initMap();
		}, 1000);
		console.log("waiting");
		return null;
	}

	var map = new google.maps.Map(document.getElementById('map'), {
			center: {
				lat: 38.435406,
				lng: -122.734462
			},
			streetViewControl: false,
			fullscreenControl: false,
			zoom: 9
		});
	var card = document.getElementById('pac-card');
	var input = document.getElementById('pac-input');
	var types = ['address'];
	var strictBounds = document.getElementById('strict-bounds-selector');

	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

	var autocomplete = new google.maps.places.Autocomplete(input);

	// Bind the map's bounds (viewport) property to the autocomplete object,
	// so that the autocomplete requests use the current map bounds for the
	// bounds option in the request.
	autocomplete.bindTo('bounds', map);

	// Set the data fields to return when the user selects a place.
	autocomplete.setFields(
		['address_components', 'geometry', 'icon', 'name']);

	var infowindow = new google.maps.InfoWindow();
	var infowindowContent = document.getElementById('infowindow-content');
	infowindow.setContent(infowindowContent);
	var marker = new google.maps.Marker({
			map: map,
			anchorPoint: new google.maps.Point(0, -29)
		});

	autocomplete.addListener('place_changed', function () {
		infowindow.close();
		marker.setVisible(false);
		var place = autocomplete.getPlace();
		if (!place.geometry) {
			// User entered the name of a Place that was not suggested and
			// pressed the Enter key, or the Place Details request failed.
			window.alert("No details available for input: '" + place.name + "'");
			return;
		}

		// If the place has a geometry, then present it on a map.
		if (place.geometry.viewport) {
			map.fitBounds(place.geometry.viewport);
		} else {
			map.setCenter(place.geometry.location);
			map.setZoom(17); // Why 17? Because it looks good.
		}
		marker.setPosition(place.geometry.location);
		marker.setVisible(true);

		var address = '';
		if (place.address_components) {
			address = [
				(place.address_components[0] && place.address_components[0].short_name || ''),
				(place.address_components[1] && place.address_components[1].short_name || ''),
				(place.address_components[2] && place.address_components[2].short_name || '')
			].join(' ');
		}

		// Custom for GrayQuarter
	
		$("input[id^=GQ]").val("");
		var address_components = place.address_components;

		var components = {};
		jQuery.each(address_components, function (k, v1) {
			jQuery.each(v1.types, function (k2, v2) {
				components[v2] = v1.long_name
			});
		});

		document.getElementById("GQ_Lat").value = marker.getPosition().lat();
		document.getElementById("GQ_Lng").value = marker.getPosition().lng();
		document.getElementById("GQ_Street_Num").value = components.street_number;
		document.getElementById("GQ_Street").value = components.route;
		document.getElementById("GQ_City").value = components.locality;
		document.getElementById("GQ_County").value = components.administrative_area_level_2;
		document.getElementById("GQ_State").value = components.administrative_area_level_1;
		document.getElementById("GQ_Zip").value = components.postal_code;
		document.getElementById("GQ_Address_Formatted").value = address;
		document.getElementById("GQ_Geometry").value = JSON.stringify(place.geometry);
		gisParcelRequest("https://services1.arcgis.com/P5Mv5GY5S66M8Z1Q/ArcGIS/rest/services/CDR_Parcels/FeatureServer/0/query?where=&objectIds=&time=&geometry=" + marker.getPosition().lng() + "%2C" + marker.getPosition().lat() + "&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&resultType=none&distance=&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&returnCentroid=false&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=");

		infowindowContent.children['place-icon'].src = place.icon;
		infowindowContent.children['place-name'].textContent = place.name;
		infowindowContent.children['place-address'].textContent = address;
		infowindow.open(map, marker);

	});

	// Sets a listener on a radio button to change the filter type on Places
	// Autocomplete.

	document.getElementById('use-strict-bounds')
	.addEventListener('click', function () {
		console.log('Checkbox clicked! New state=' + this.checked);
		autocomplete.setOptions({
			strictBounds: this.checked
		});
	});
}

function gisParcelRequest(url) {

	var xReq = new XMLHttpRequest();

	console.log("Parcel Request Queued : " + url);
	xReq.addEventListener("progress", updateProgress);
	xReq.addEventListener("load", transferComplete);
	xReq.addEventListener("error", transferFailed);
	xReq.addEventListener("abort", transferCanceled);

	var updateProgress = function () {
		console.log("Parcel updateProgress");
	}

	function transferComplete(evt) {
		console.log("Parcel The transfer is complete.");
	}

	function transferFailed(evt) {
		console.log("Parcel An error occurred while transferring the file.");
	}

	function transferCanceled(evt) {
		console.log("Parcel The transfer has been canceled by the user.");
	}

	xReq.open("GET", url);
	xReq.setRequestHeader('Content-Type', 'text/plain');
	xReq.onreadystatechange = function () {
		if (this.readyState === 4 && this.status === 200) {
			console.log("Parcel Request State of 200");
			var myArr = JSON.parse(this.responseText);
			if (myArr.features && myArr.features[0]) {
				document.getElementById("GQ_Parcel").value = myArr.features[0].attributes.APN;
				document.getElementById("GQ_ParcelData").value = JSON.stringify(myArr.features[0].attributes);
				if (myArr.features[0].attributes.APN) {
					gisFireRequest("https://services1.arcgis.com/P5Mv5GY5S66M8Z1Q/ArcGIS/rest/services/CalFire_Damage_Assessment_2017/FeatureServer/0/query?where=APN_ISD%3D%27" + myArr.features[0].attributes.APN  + "%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=");
				}
			}
			else {
				console.log("Parcel No Parcel Data Found");
			}
		}
	}

	xReq.send();
}

function gisFireRequest(url) {

	var XReq2 = new XMLHttpRequest();

	console.log("Fire Request Queued : " + url);
	
	XReq2.addEventListener("progress", updateProgress);
	XReq2.addEventListener("load", transferComplete);
	XReq2.addEventListener("error", transferFailed);
	XReq2.addEventListener("abort", transferCanceled);

	var updateProgress = function () {
		console.log("Fire Request updateProgress");
	}

	function transferComplete(evt) {
		console.log("Fire Request The transfer is complete.");
	}

	function transferFailed(evt) {
		console.log("Fire Request An error occurred while transferring the file.");
	}

	function transferCanceled(evt) {
		console.log("Fire Request The transfer has been canceled by the user.");
	}

	XReq2.open("GET", url);
	XReq2.setRequestHeader('Content-Type', 'text/plain');
	XReq2.onreadystatechange = function () {;
		if (this.readyState === 4 && this.status === 200) {
			console.log("Fire Request State of 200");
			var myArr = JSON.parse(this.responseText);
			if (myArr.features[0]) {
				document.getElementById("GQ_FireData").value = JSON.stringify(myArr.features);
			}
		}


	}
	XReq2.send();
}

</script>
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDGgWACYqe9odqCOdfAU3Hovi2qkVR8wbI&libraries=places&callback=initMap"></script>