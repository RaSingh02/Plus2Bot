#!/bin/bash
python main.py &
gunicorn -c gunicorn.conf.py api:app
