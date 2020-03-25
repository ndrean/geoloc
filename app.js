// import "https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.js";
const mapbox_token =
  "pk.eyJ1IjoibmRyZWFuIiwiYSI6ImNrMnE2d3RlZTBiMjkzZHA3enZ4dXU1cmEifQ.5DQRQQ9H6Gb0Fpat5mz1uw";

const mymap = L.map("mapid").setView([45, 0], 5);
L.tileLayer(
  `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${mapbox_token}`,
  {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 30,
    id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
    accessToken: mapbox_token
  }
).addTo(mymap);

/* show GSP coord on clicked point on the map */

const getGPS = () => {
  document.getElementById("start").addEventListener("click", () => {
    navigator.geolocation.watchPosition(
      position => {
        // destructure the GPS response
        const {
          coords: { latitude: lat, longitude: long }
        } = position;

        // display fetch gps coordinates in input fields
        document.getElementById("geo-lat").value = lat.toPrecision(4);
        document.getElementById("geo-lng").value = long.toPrecision(4);

        // circle around point of 50m
        L.circle([lat, long], {
          color: "red",
          fillColor: "#f03",
          fillOpacity: 0.2,
          radius: 50
        })
          .addTo(mymap)
          .bindPopup(reverseGPS({ lat: lat, lng: long }))
          .openPopup();

        return { lat: lat, lng: long };
      },
      err => {
        console.log(err);
      },
      {
        enableHighAccuracy: true
      }
    );
  });
};

const reverseGPS = point => {
  L.esri.Geocoding.geocodeService()
    .reverse()
    .latlng([point.lat, point.lng])
    .run(function(error, result) {
      if (error) {
        return;
      }
      L.circle(result.latlng, {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.2,
        radius: 50
      })
        .addTo(mymap)
        .bindPopup(result.address.Match_addr)
        .openPopup();

      document.getElementById("coord").textContent = `
        Latitude : ${result.latlng.lat.toPrecision(3)},
        Longitude : ${result.latlng.lng.toPrecision(3)}`;
      document.getElementById("address").textContent = `
        ${result.address.Match_addr}`;

      const place = {};
      place.gps = point;
      place.location = result.address.Match_addr;
      /* since local/sessionStorage works with {"key":"values"} in strings,
      we will create a "key" with the current date-time associated to the place
      and stringify the 'place' data */
      place.date = Date.now().toString(); // the "key"

      try {
        sessionStorage.setItem(place.date, JSON.stringify(place));
        console.table(sessionStorage);
      } catch (err) {
        console.log("Storage failed :", err);
      }

      return result.address.Match_addr;
    });
};

const displayReverseInput = e => {
  e.preventDefault();
  try {
    reverseGPS({
      lat: document.getElementById("geo-lat").value,
      lng: document.getElementById("geo-lng").value
    });
  } catch (err) {
    console.log("can't find this place :", err);
  }
};

const showGPS = e => {
  L.popup()
    .setLatLng(e.latlng)
    .setContent(reverseGPS(e.latlng))
    .openOn(mymap);
};

/* Start */
sessionStorage.clear();

if ("geolocation" in navigator) {
  // geolocate computer
  getGPS();

  // if input is manually changed, display new point
  mymap.on("click", showGPS);

  // clic on the map and get info displayed
  document
    .getElementById("reverse-locate-me")
    .addEventListener("click", displayReverseInput);
}

/* CMD+SHIFT+P in console => sensor : Geolocation */
