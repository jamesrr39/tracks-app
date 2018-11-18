.PHONY: help
help:
	echo 'see README/Makefile'

bundle_static_assets:
	cd client && yarn build

build_prod: bundle_static_assets
	rm -rf build
	go run vendor/github.com/rakyll/statik/statik.go -src=client/build -dest=build/client
	go build -tags "purego prod" -o bin/tracks-app cmd/tracks-app-main.go

build_docker_raspberry_pi_3:
	mkdir -p docker/tracks-linux/bin
	env CGO_ENABLED=0 GOARM=7 GOARCH=arm go build -tags "purego prod" -o docker/tracks-raspberry-pi/bin/tracks-app-raspberry-pi cmd/tracks-app-main.go
	docker build -t jamesrr39/tracks-app-raspberry-pi docker/tracks-raspberry-pi

build_docker_linux_amd64: bundle_static_assets
	mkdir -p docker/tracks-linux/bin
	env CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -tags "purego prod" -o docker/tracks-linux/bin/tracks-app-linux cmd/tracks-app-main.go
	docker build -t jamesrr39/tracks_linux docker/tracks-linux

run_dev_client:
	cd client && yarn start

.PHONY: install
install: build_prod
	cp bin/tracks-app $(GOBIN)/tracks-app

# docker save jamesrr39/tracks-app-raspberry-pi:latest | bzip2 |      ssh raspberrypi 'bunzip2 | sudo docker load'
# docker run -d -p 8090:8090 -v /mnt/enc-container-1/data/tracks:/home/tracks/tracks-data jamesrr39/tracks-app-raspberry-pi
