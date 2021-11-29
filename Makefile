.PHONY: start
start:
	yarn
	pm2 start -- environment.json
