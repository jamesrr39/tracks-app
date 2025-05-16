LOCALENV_DATA_DIR=localenv/data

OPENAPI_SPEC_OUTDIR=web-client/docs
VITE_DEV_SERVER_ADDR=http://localhost:5173
PM_TILES_FILEPATH=localenv/map/pmtiles/v3.pmtiles

.PHONY: help
help:
	echo 'see README/Makefile'

.PHONY: bundle_static_assets
bundle_static_assets:
	cd client && yarn build

.PHONY: build_prod
build_prod: bundle_static_assets
	rm -rf build
	go run vendor/github.com/rakyll/statik/statik.go -src=client/build -dest=build/client
	go build -tags "purego prod" -o bin/tracks-app cmd/tracks-app-main.go

.PHONY: build_docker_raspberry_pi_3
build_docker_raspberry_pi_3:
	mkdir -p docker/tracks-linux/bin
	env CGO_ENABLED=0 GOARM=7 GOARCH=arm go build -tags "purego prod" -o docker/tracks-raspberry-pi/bin/tracks-app-raspberry-pi cmd/tracks-app-main.go
	docker build -t jamesrr39/tracks-app-raspberry-pi docker/tracks-raspberry-pi

.PHONY: build_docker_linux_amd64
build_docker_linux_amd64: bundle_static_assets
	mkdir -p docker/tracks-linux/bin
	env CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -tags "purego prod" -o docker/tracks-linux/bin/tracks-app-linux cmd/tracks-app-main.go
	docker build -t jamesrr39/tracks_linux docker/tracks-linux

.PHONY: run_dev_client
run_dev_client:
	cd web-client && yarn dev

.PHONY: run_dev_server
run_dev_server:
	LOCAL_DEV_SERVER_URL=${VITE_DEV_SERVER_ADDR} go run cmd/tracks-app-main.go serve ${LOCALENV_DATA_DIR} --pmtiles-file-path ${PM_TILES_FILEPATH}

.PHONY: install
install: build_prod
	cp bin/tracks-app $(GOBIN)/tracks-app

.PHONY: generate_openapi_typescript
generate_openapi_typescript:
	mkdir -p ${OPENAPI_SPEC_OUTDIR}
	go run cmd/tracks-app-main.go generate-openapi-spec --output ${OPENAPI_SPEC_OUTDIR}/openapi3-spec.yml
	cd web-client && mkdir -p src/openapi/generated && rm -f src/openapi/generated/* && yarn generate-openapi

.PHONY: generate_garmin_products_list
generate_garmin_products_list:
	mkdir -p server/domain/garminproducts
	go run scripts/gen-garmin-products-map/gen-garmin-products-map.go --package-name garminproducts --output-file server/domain/garminproducts/garmin_products.go