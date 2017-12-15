Go Tracks App

Provides a way to view .fit tracks produced by sport devices.

To run in dev mode:

Start server:

    go run cmd/tracks-app-main.go <path-to-fit-tracks>

The server should tell you (in the logs) which port it is broadcasting on.

Start webpack client:

    cd client
    yarn start

For production and docker builds, see the Makefile.
