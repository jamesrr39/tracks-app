
build: bundle_static_assets
	go build -tags prod -o bin/tracks-app

bundle_static_assets:
	# bundle then move output to clienthandler.
	# go-bindata-assetfs doesn't include assetFS() when using the -o flag
	go-bindata-assetfs -tags prod -pkg clienthandler client/...
	mv bindata_assetfs.go clienthandler/bindata_assetfs.go
