FROM alpine

COPY ./bin/tracks-app-raspberry-pi /opt/

# don't assign password, don't assign home directory
RUN adduser -D -H tracks

RUN chown -R tracks:tracks /opt
RUN chmod 700 /opt/tracks-app-raspberry-pi
RUN mkdir /data && chown -R tracks /data

EXPOSE 8090

USER tracks

RUN mkdir -p /home/tracks/.cache/tracks-app-cache
RUN mkdir -p /home/tracks/tracks-data

ENTRYPOINT ["/opt/tracks-app-raspberry-pi", "--caches-dir=/home/tracks/.cache/tracks-app-cache", "--addr=:8090", "/home/tracks/tracks-data"]
