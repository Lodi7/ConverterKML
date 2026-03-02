let parsedWaypoints = [];
let fileData = null;

// Deteksi touch device → update teks dropzone
if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
  document.getElementById("dropTitle").textContent = "Tap untuk pilih file KML";
  document.getElementById("dropSub").innerHTML =
    "format <span>.kml</span> · dari Files / Google Drive";
}

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const fileLoaded = document.getElementById("fileLoaded");
const fileName = document.getElementById("fileName");
const fileMeta = document.getElementById("fileMeta");
const fileRemove = document.getElementById("fileRemove");
const distSlider = document.getElementById("distSlider");
const distVal = document.getElementById("distVal");
const distDesc = document.getElementById("distDesc");
const btnConvert = document.getElementById("btnConvert");
const btnDownload = document.getElementById("btnDownload");
const logEl = document.getElementById("log");
const stats = document.getElementById("stats");

// Dropzone
dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("drag-over");
});
dropzone.addEventListener("dragleave", () =>
  dropzone.classList.remove("drag-over"),
);
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});
fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) loadFile(e.target.files[0]);
});

fileRemove.addEventListener("click", () => {
  fileData = null;
  parsedWaypoints = [];
  fileLoaded.classList.remove("show");
  fileInput.value = "";
  btnConvert.disabled = true;
  btnDownload.classList.remove("show");
  logEl.classList.remove("show");
  stats.style.display = "none";
});

function loadFile(file) {
  if (!file.name.endsWith(".kml")) {
    addLog("err", `File harus berformat .kml`);
    logEl.classList.add("show");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    fileData = e.target.result;
    fileName.textContent = file.name;
    fileMeta.textContent = `${(file.size / 1024).toFixed(1)} KB`;
    fileLoaded.classList.add("show");
    parseKML(fileData);
  };
  reader.readAsText(file);
}

function parseKML(text) {
  logEl.innerHTML = "";
  logEl.classList.add("show");

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");

  const ns = "http://www.opengis.net/kml/2.2";
  let coordsElements = doc.getElementsByTagNameNS(ns, "coordinates");
  if (coordsElements.length === 0) {
    coordsElements = doc.getElementsByTagName("coordinates");
  }

  if (coordsElements.length === 0) {
    addLog("err", "Tidak ditemukan elemen coordinates di KML");
    return;
  }

  const rawPoints = [];
  for (let el of coordsElements) {
    const raw = el.textContent.trim();
    const tokens = raw.split(/\s+/);
    for (let token of tokens) {
      const parts = token.split(",");
      if (parts.length >= 2) {
        const lon = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        const alt = parts.length >= 3 ? parseFloat(parts[2]) : 0.0;
        if (
          !isNaN(lat) &&
          !isNaN(lon) &&
          lat >= -90 &&
          lat <= 90 &&
          lon >= -180 &&
          lon <= 180
        ) {
          rawPoints.push([lat, lon, isNaN(alt) ? 0 : alt]);
        }
      }
    }
  }

  addLog("ok", `${rawPoints.length} titik GPS ditemukan`);
  parsedWaypoints = rawPoints;
  updateStats();
  btnConvert.disabled = false;

  // hitung jarak total
  let totalDist = 0;
  for (let i = 1; i < rawPoints.length; i++) {
    totalDist += haversine(
      rawPoints[i - 1][0],
      rawPoints[i - 1][1],
      rawPoints[i][0],
      rawPoints[i][1],
    );
  }
  document.getElementById("statDist").textContent =
    totalDist > 1000
      ? (totalDist / 1000).toFixed(2) + "km"
      : Math.round(totalDist) + "m";
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const p1 = (lat1 * Math.PI) / 180,
    p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180,
    dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function filterWaypoints(points, minDist) {
  if (minDist <= 0 || points.length === 0) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const last = result[result.length - 1];
    const d = haversine(last[0], last[1], points[i][0], points[i][1]);
    if (d >= minDist) result.push(points[i]);
  }
  return result;
}

function updateStats() {
  const minDist = parseFloat(distSlider.value);
  const filtered = filterWaypoints(parsedWaypoints, minDist);
  document.getElementById("statTotal").textContent = parsedWaypoints.length;
  document.getElementById("statFiltered").textContent = filtered.length;
  stats.style.display = "grid";
}

distSlider.addEventListener("input", () => {
  const v = parseFloat(distSlider.value).toFixed(1);
  distVal.textContent = v;
  distDesc.textContent = v + "m";
  if (parsedWaypoints.length > 0) updateStats();
});

btnConvert.addEventListener("click", () => {
  if (parsedWaypoints.length === 0) return;

  const minDist = parseFloat(distSlider.value);
  const waypoints = filterWaypoints(parsedWaypoints, minDist);

  addLog("info", `Filter jarak: ${minDist}m`);
  addLog("ok", `${waypoints.length} waypoint akan ditulis`);

  const items = waypoints.map((wp, i) => ({
    autoContinue: true,
    command: 16,
    doJumpId: i + 1,
    frame: 0,
    params: [0.0, 0.0, 0.0, 0.0, wp[0], wp[1], wp[2]],
    type: "SimpleItem",
  }));

  const plan = {
    fileType: "Plan",
    geoFence: { circles: [], polygons: [], version: 2 },
    groundStation: "QGroundControl",
    mission: {
      cruiseSpeed: 15,
      firmwareType: 3,
      hoverSpeed: 5,
      items,
      plannedHomePosition: [waypoints[0][0], waypoints[0][1], 0.0],
      vehicleType: 2,
      version: 2,
    },
    rallyPoints: { points: [], version: 2 },
    version: 1,
  };

  const blob = new Blob([JSON.stringify(plan, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  btnDownload.href = url;
  btnDownload.classList.add("show");

  addLog("ok", `File siap didownload!`);
});

function addLog(type, msg) {
  const line = document.createElement("div");
  line.className = `log-line log-${type}`;
  const prefix = type === "ok" ? "✓" : type === "err" ? "✗" : "·";
  line.innerHTML = `<span>${prefix}</span><span>${msg}</span>`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}
