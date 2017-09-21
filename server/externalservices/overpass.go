package externalservices

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jamesrr39/tracks-app/server/domain"
)

func FetchNearbyCityData(activityBounds *domain.ActivityBounds) error {
	client := &http.Client{
		Timeout: time.Minute,
	}

	url := fmt.Sprintf("https://overpass-api.de/api/interpreter?data=[out:json];node[\"place\"](%s);out;", formatBoundsToOverpassFormat(activityBounds))

	// place name
	//req, err := http.NewRequest("GET", "https://overpass-api.de/api/interpreter?data=node[name=\"London\"];out;", bytes.NewBuffer(nil))

	req, err := http.NewRequest("GET", url, bytes.NewBuffer(nil))
	if nil != err {
		return err
	}

	resp, err := client.Do(req)
	if nil != err {
		return err
	}
	defer resp.Body.Close()

	var overpassResponseObject *overpassResponse
	err = json.NewDecoder(resp.Body).Decode(&overpassResponseObject)
	if nil != err {
		return err
	}

	bb := bytes.NewBuffer(nil)
	err = json.NewEncoder(bb).Encode(overpassResponseObject)
	if nil != err {
		return err
	}

	fmt.Println(string(bb.Bytes()))

	return nil
}

func formatBoundsToOverpassFormat(activityBounds *domain.ActivityBounds) string {
	return fmt.Sprintf("%.02f,%.02f,%.02f,%.02f",
		activityBounds.LatMin,
		activityBounds.LongMin,
		activityBounds.LatMax,
		activityBounds.LongMax)
}

/*
"id": 703475339,
"lat": 4.1453423,
"lon": -73.7112897,
"tags": {
  "comment": "convertido a OSM usando http://GaleNUx.com",
  "divipola": "50001",
  "fixme": "Revisar: este punto fue creado por importación directa",
  "is_in": "Colombia; Meta ; Villavicencio",
  "name": "Samaria",
  "note": "ADMINISTRATIVO, VEREDA, 43fb5de38c0c9be6a27c91497f9e7ce9",
  "place": "hamlet",
*/

type overpassResponse struct {
	Elements []*overpassResponseElement `json:"elements"`
}

type overpassResponseElement struct {
	Tags struct {
		Name  string `json:"name"`
		Place string `json:"place"`
		IsIn  string `json:"is_in"`
	} `json:"tags"`
}
