import { Marker } from "maplibre-gl";
import { binarySearch, BinarySearchResult } from "../../util/binary_search";
import { formatShortDuration, getDurationSeconds } from "../../util/time";
import { DomainGeoFileSummary, DomainRecord } from "../../openapi/generated/tracksAppSchemas";

const INTERVAL_METRES = 1000;

export const createMarkers = (trackSummary: DomainGeoFileSummary, trackRecords: DomainRecord[]) => {
  const totalDistanceMetres = trackRecords[trackRecords.length - 1].distance;

  if (totalDistanceMetres < INTERVAL_METRES) {
    return []
  }

  const markers: maplibregl.Marker[] = [];

  for (
    let targetDistance = INTERVAL_METRES;
    targetDistance < totalDistanceMetres;
    targetDistance += INTERVAL_METRES
  ) {
    const closestMatchIdx = binarySearch(trackRecords.length, (currIdx) => {
      const currDistance = trackRecords[currIdx].distance;

      if (currDistance === targetDistance) {
        return BinarySearchResult.EXACT_MATCH;
      }

      if (currDistance > targetDistance) {
        return BinarySearchResult.GO_LOWER;
      }

      return BinarySearchResult.GO_HIGHER;
    });

    const closestRecord = trackRecords[closestMatchIdx];
    const { startTime } = trackSummary;
    const durationDisplay = formatShortDuration(
      getDurationSeconds({ startTime, endTime: closestRecord.timestamp })
    );
    const marker = new Marker();
    marker.setLngLat([closestRecord.posLong, closestRecord.posLat]);

    const iconEl = document.createElement("div");
    iconEl.style.marginBottom = "30px";

    const textEl = document.createElement("div");
    textEl.style.backgroundColor = "white";
    textEl.style.opacity = "0.5";
    textEl.style.padding = "5px";
    textEl.style.borderRadius = "8px";
    textEl.innerText = `${targetDistance / 1000}km`;
    textEl.appendChild(document.createElement("br"));
    textEl.append(durationDisplay);

    const svgContainerEl = document.createElement("div");
    svgContainerEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1"/>
  </svg>`;

    iconEl.appendChild(textEl);
    iconEl.appendChild(svgContainerEl);

    const markerEl = marker.getElement();
    markerEl.innerHTML = "";
    markerEl.appendChild(iconEl);

    markers.push(marker);
  }

  return markers;
};
