package garminproducts

var GarminProductsByCodeMap = make(map[uint16]GarminProduct)

func init() {
	for _, product := range GarminProducts {
		GarminProductsByCodeMap[product.Code] = product
	}
}
