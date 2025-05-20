# syntax=docker/dockerfile:1
# escape=\

FROM postgres@sha256:7b86711ac72674c8f2cf0fad7fd55cb07ae709c62fa0cddfa78e28e985fffe09

RUN apk update \
	&& apk upgrade \
	&& apk add vim curl

COPY --chown=postgres:postgres ./conf/pg_hba.conf /etc/postgresql/pg_hba.conf
COPY --chown=postgres:postgres ./conf/postgresql.conf /etc/postgresql/postgresql.conf

RUN mkdir /etc/postgresql/game_pong_postgres

RUN chmod 600 /etc/postgresql/pg_hba.conf /etc/postgresql/postgresql.conf

COPY --chown=root:root ./tools/01_replicat_init.sh /docker-entrypoint-initdb.d/01_replicat_init.sh
RUN chmod +x /docker-entrypoint-initdb.d/01_replicat_init.sh

COPY --chown=root:root ./tools/02_replicat_init.sh /home/init/02_replicat_init.sh
RUN chmod +x /home/init/02_replicat_init.sh

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]
