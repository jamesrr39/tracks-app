
build: clean bundle_static_assets
	go build -tags prod -o bin/tracks-app

clean:
	rm -rf build/*

bundle_static_assets:
	go run scripts/build-prod.go
