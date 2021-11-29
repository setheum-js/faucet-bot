.PHONY: start
start:
	yarn
	pm2 start -- environment.json

.PHONY: stop
stop:
	pm2 stop all
