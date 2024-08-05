package domain

type GeographicMapElement struct {
	Tags struct {
		Name  string `json:"name" required:"true"`
		Place string `json:"place" required:"true"`
		IsIn  string `json:"isIn" required:"true"`
	} `json:"tags" required:"true"`
}
