
build: bundle_static_assets
	go build -tags prod -o bin/tracks-app

bundle_static_assets:
	go-bindata-assetfs -tags prod -o clienthandler/generated_static_web_files.go -pkg clienthandler client/...
