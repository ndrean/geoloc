// import "https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.js";
// const mapbox_token =
//   "pk.eyJ1IjoibmRyZWFuIiwiYSI6ImNrMnE2d3RlZTBiMjkzZHA3enZ4dXU1cmEifQ.5DQRQQ9H6Gb0Fpat5mz1uw";

const mymap = L.map("mapid").setView([45, 0], 5) || "/WesternEurope.jpg";
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
    const id = navigator.geolocation.watchPosition(
      position => {
        const {
          coords: { latitude, longitude }
        } = position;

        const time = Date(new Date());
        data.push([time, latitude, longitude]);

        document.querySelector("#record-table tbody").insertAdjacentHTML(
          "afterbegin",
          `
            <tr>
              <td scope="col" style="border: solid;color:white;">${time}</td>
              <td scope="col" style="border: solid; color:white;">${latitude.toPrecision(
                4
              )}</td>
              <td scope="col" style="border: solid; color:white;">${longitude.toPrecision(
                4
              )}</td>
            </tr>
          `
        );
        // display on the map
        L.circle([latitude, longitude], {
          color: "red",
          fillColor: "#f03",
          fillOpacity: 0.2,
          radius: 50
        })
          .addTo(mymap)
          .bindPopup(
            `
          lat: ${latitude.toPrecision(4)},
          lng: ${longitude.toPrecision(4)},
        `
          )
          .openPopup();
        console.table(data);

        return data;
      },
      err => {
        console.log(err);
      }
    );
    document.getElementById("stop").addEventListener("click", () => {
      navigator.geolocation.clearWatch(id);
    });
  });
};

/* Promise that return GPS's sensor results  */
const promiseCoordinates = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      //resolve, reject,options
      position => {
        const {
          coords: { latitude: lat, longitude: long }
        } = position;
        resolve({ lat: lat, long: long }); // this returns
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

/* returns GPS sensor results when clicked on button
2 versions : (promise.then.catch) and (await and try-catch)*/

const getGPS = async () => {
  document.getElementById("getGPS").addEventListener("click", async () => {
    /*   version promise().then(..).catch()
    // promiseCoordinates()
    //   .then(response => {
    //     const { lat, long } = response;
    //     document.getElementById("geo-lat").value = lat.toPrecision(4);
    //     document.getElementById("geo-lng").value = long.toPrecision(4);
    //     return reverseGPS({ lat: lat, lng: long });
    //   })
    //   .catch(err => {
    //     console.log(err);
    //   });
    */

    /* version try catch */
    try {
      const { lat, long } = await promiseCoordinates(); // resolve & estructure response
      // fill the HTML input with the result
      document.getElementById("geo-lat").value = lat.toPrecision(4);
      document.getElementById("geo-lng").value = long.toPrecision(4);
      // get the address and display popup
      return reverseGPS({ lat: lat, lng: long });
    } catch (err) {
      console.log(err);
      window.alert(err.message);
    }
  });
};

/* get the name from coordinates with ESRI and display popup
Can't return */

function reverseGPS(point) {
  L.esri.Geocoding.geocodeService()
    .reverse()
    .latlng(point)
    .run(function(error, result) {
      if (error) {
        alert("Network error");
        return;
      }
      const country = result.address.CountryCode;
      const address = result.address.Match_addr;

      // display a geolocated circle on the map
      L.circle(point, {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.2,
        radius: 50
      })
        .addTo(mymap)
        .bindPopup(
          ` 
        <p> lat: ${Number(point.lat).toPrecision(4)},
           lng: ${Number(point.lng).toPrecision(4)}
        </p>
        <p> ${address}, ${country} </p>
        `
        )
        .openPopup();

      const place = {
        lat: Number(point.lat).toPrecision(4),
        lng: Number(point.lng).toPrecision(4),
        address: address,
        country: country
      };

      fillNewRowInTable({
        table: mapTable,
        keys: ["country", "lat", "lng", "address"],
        place: place
      });
      // Note: localStorage is synchronous
      sessionStorage.setItem(Date.now(), JSON.stringify(place));
      console.table(sessionStorage);
      return place;
    });
}

// display point when coordinates are given from HTML input
const displayReverseInput = () => {
  reverseGPS({
    lat: Number(document.getElementById("geo-lat").value).toPrecision(4),
    lng: Number(document.getElementById("geo-lng").value).toPrecision(4)
  });
};

// callback attached to the map and clicked point from the map
const showPoint = e => {
  // e captures the clicked location of the map
  reverseGPS({ lat: e.latlng.lat, lng: e.latlng.lng });
};

const createCell = cell => {
  const td = document.createElement("td");
  td.setAttribute("scope", "col");
  td.textContent = cell;
  td.style.border = "solid";
  td.style.color = "white";
  return td;
};

const fillNewRowInTable = ({ keys: keys, place: place, table: table }) => {
  const newRow = document.createElement("tr");
  table.appendChild(newRow);
  for (const key of keys) {
    newRow.appendChild(createCell(place[key]));
  }
};

const createTable = id => {
  const table = document.createElement("table");
  document.getElementById(id).appendChild(table);
  table.className = "table";
  const tableBody = document.createElement("tbody");
  table.appendChild(tableBody);
  return tableBody;
};

/* Start */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err));
  });
}

// Create table/Header for data recording
const data = [];
const table = document.createElement("table");
document.getElementById("record-table").appendChild(table);
table.className = "table"; // Bootstrap
table.classList.add = "toto";
const tableHead = document.createElement("thead");
table.appendChild(tableHead);
fillNewRowInTable({
  table: tableHead,
  keys: ["time", "lat", "lng"],
  place: {
    lat: "Latitude",
    lng: "Longitude",
    time: "Date"
  }
});
const tableBody = document.createElement("tbody");
table.appendChild(tableBody);

// select type of map on demand
document.querySelector("#basemaps").addEventListener("change", e => {
  const basemap = e.target.value;
  setBasemap(basemap);
});

// recording function
watchGPS();

sessionStorage.clear();
const mapTable = createTable("map-table");
mapTable.className = "table";

// geolocate computer
if ("geolocation" in navigator) {
  getGPS();
} else {
  throw new Error("Geolocation not supported");
}

// if input is manually changed, display new point
mymap.on("click", showPoint);

// clic on the map and get info displayed the page and map with popup
document
  .getElementById("reverse-locate-me")
  .addEventListener("click", displayReverseInput);

/* CMD+SHIFT+P in console => sensor : Geolocation setup*/
