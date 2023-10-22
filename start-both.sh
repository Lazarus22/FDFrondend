#!/bin/bash
npm run start &  # Start Svelte app
nginx -c ./nginx.conf 