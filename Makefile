
build: bundle_static_assets
	go build -o bin/go-tracks-app

bundle_static_assets:
	go-bindata-assetfs -tags prod -o clienthandler/generated_static_web_files.go -pkg clienthandler client/...
