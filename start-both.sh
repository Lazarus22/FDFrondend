#!/bin/bash
npm run start &  # Start Svelte app
nginx -c ./tmp/nginx/nginx.conf