// import "https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.js";
// const mapbox_token =
//   "pk.eyJ1IjoibmRyZWFuIiwiYSI6ImNrMnE2d3RlZTBiMjkzZHA3enZ4dXU1cmEifQ.5DQRQQ9H6Gb0Fpat5mz1uw";

const mymap = L.map("mapid").setView([45, 0], 5);
// L.tileLayer(
//   `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${mapbox_token}`,
//   {
//     attribution:
//       'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
//     maxZoom: 30,
//     id: "mapbox/streets-v11",
//     tileSize: 512,
//     zoomOffset: -1,
//     accessToken: mapbox_token
//   }
// ).addTo(mymap);

// switch basemap
let layer = L.esri.basemapLayer("Topographic").addTo(mymap);
let layerLabels;

function setBasemap(basemap) {
  if (layer) {
    mymap.removeLayer(layer);
  }

  layer = L.esri.basemapLayer(basemap);

  mymap.addLayer(layer);

  if (layerLabels) {
    mymap.removeLayer(layerLabels);
  }

  if (
    basemap === "ShadedRelief" ||
    basemap === "Oceans" ||
    basemap === "Gray" ||
    basemap === "DarkGray" ||
    basemap === "Terrain"
  ) {
    layerLabels = L.esri.basemapLayer(basemap + "Labels");
    mymap.addLayer(layerLabels);
  } else if (basemap.includes("Imagery")) {
    layerLabels = L.esri.basemapLayer("ImageryLabels");
    mymap.addLayer(layerLabels);
  }
}

const watchGPS = () => {
  document.getElementById("start").addEventListener("click", () => {
    navigator.geolocation.watchPosition(
      position => {
        const {
          coords: { latitude, longitude }
        } = position;
        console.log(latitude);
        const time = Number(new Date());
        data.push([time, latitude, longitude]);

        const tr = document.createElement("tr");
        let td = document.createElement("td");
        td.setAttribute("scope", "col");
        td.style.border = "solid";
        td.textContent = time;
        tr.appendChild(td);
        td = document.createElement("td");
        td.setAttribute("scope", "col");
        td.style.border = "solid";
        td.textContent = latitude;
        tr.appendChild(td);
        td = document.createElement("td");
        td.setAttribute("scope", "col");
        td.style.border = "solid";
        td.textContent = longitude;
        tr.appendChild(td);
        tb.appendChild(tr);

        console.log(data);
        return data;
      },
      err => {
        console.log(err);
      }
    );
  });
};

const data = [];
const table = document.getElementById("table");

const t = document.createElement("table");
t.className = "table";

const tb = document.createElement("tbody");
t.appendChild(tb);
table.appendChild(t);
watchGPS();

export { watchGPS };

/* show GSP coord on clicked point on the map */
// Promise version
const getCoordinates = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => {
        const {
          coords: { latitude: lat, longitude: long }
        } = position;
        resolve({ lat: lat, long: long });
      },
      error => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};
const getGPS = () => {
  document.getElementById("getGPS").addEventListener("click", async () => {
    try {
      const coords = await getCoordinates();
      const { lat, long } = coords; // destructure

      document.getElementById("geo-lat").value = lat.toPrecision(4);
      document.getElementById("geo-lng").value = long.toPrecision(4);
      // mark a circle on the map
      L.circle([lat, long], {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.2,
        radius: 1000
      })
        .addTo(mymap)
        .bindPopup(reverseGPS({ lat: lat, lng: long }))
        .openPopup();
      return { lat: lat, lng: long };
    } catch (err) {
      console.log(err);
    }
  });
};

// get the name from coordinates with ESRI
const reverseGPS = point => {
  L.esri.Geocoding.geocodeService()
    .reverse()
    .latlng([point.lat, point.lng])
    .run(function(error, result) {
      if (error) {
        return;
      }
      // display a geolocated circle on the map
      L.circle(result.latlng, {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.2,
        radius: 50
      })
        .addTo(mymap)
        .bindPopup(result.address.Match_addr)
        .openPopup();

      // display result in the page HTML
      document.getElementById("coord").textContent = `
      Latitude : ${result.latlng.lat.toPrecision(3)},
      Longitude : ${result.latlng.lng.toPrecision(3)}`;
      document.getElementById("address").textContent = `
      ${result.address.Match_addr}`;

      /* save local/sessionStorage. It works with {"key":"values"} in strings,
    we will create a "key" with the current date-time associated to the place
    and stringify the 'place' data */
      const place = {};
      place.gps = point;
      place.location = result.address.Match_addr;
      place.date = Date.now().toString(); // the "key"

      // localStorage is synchronous
      sessionStorage.setItem(place.date, JSON.stringify(place));
      console.table(sessionStorage);

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
    console.log(err);
  }
};

// display reverse result in popup
const showGPS = e => {
  L.popup()
    .setLatLng(e.latlng)
    .setContent(reverseGPS(e.latlng))
    .openOn(mymap);
};

/* Start */
sessionStorage.clear();

// select type of map on demand
document.querySelector("#basemaps").addEventListener("change", e => {
  const basemap = e.target.value;
  setBasemap(basemap);
});

// geolocate computer
if ("geolocation" in navigator) {
  getGPS();
} else {
  throw new Error("Geolocation not supported");
}

// if input is manually changed, display new point
mymap.on("click", showGPS);

// clic on the map and get info displayed the page and map with popup
document
  .getElementById("reverse-locate-me")
  .addEventListener("click", displayReverseInput);

/* CMD+SHIFT+P in console => sensor : Geolocation setup*/
