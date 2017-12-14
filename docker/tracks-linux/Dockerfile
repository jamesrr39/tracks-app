FROM alpine

COPY ./bin/tracks-app-linux /opt/

# do not assign password, do not assign home directory
RUN adduser -D tracks

RUN chown -R tracks:tracks /opt
RUN chmod 700 /opt/tracks-app-linux

EXPOSE 8090

USER tracks

RUN mkdir -p /home/tracks/.cache/tracks-app-cache
RUN mkdir -p /home/tracks/tracks-data


ENTRYPOINT ["/opt/tracks-app-linux", "--caches-dir=/home/tracks/.cache/tracks-app-cache", "--addr=:8090", "/home/tracks/tracks-data"]
