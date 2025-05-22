#!/bin/sh

sh /var/lib/postgresql/00_replicat_init.sh

postgres -D /var/lib/postgresql/data
