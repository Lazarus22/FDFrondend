#!/bin/sh
httpd -f /app/apache/httpd.conf &
cd /app/www
npx sirv public --host 0.0.0.0 --no-clear