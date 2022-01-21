# My Epitech Relay

A barely working relay for interacting with My Epitech endpoints without token.

## About

### How?
It is backed up with Puppeteer to provide authentication mechanics.
Basically, it is a headless Chromium browser that sometimes does run
only for token refresh purposes (Once every few hours).

### Why?
Because there actually is no easy way to use the data provided by
these endpoints due to oauth.

## Install & build

Install NodeJS and NPM, clone this repo, and run the following commands inside:

```bash
npm install
npm run build
```

## Manual login

> BE CAREFUL, a `cookies.json` file will be created, and may allow everyone whom
> has access to it to login to the Microsoft account you were logged in!!

Before getting started, you need to know that the first login must be done.
This step requires a graphical interface and may occur as soon as Microsoft auth
requires it.

### Graphical interface

If Microsoft authentication is required, a window will appear, DO NOT CLOSE IT,
or you will need to restart the relay.

You will need to authenticate in this window, in the opened tab. Complete all
authentication steps, click on "Stay logged in" everywhere you're asked, and
wait until you are back on my.epitech.eu. The window should close.

### `NO_WINDOW` mode (or Docker)

Let's say you don't have any graphical interface. You will need to provide the
cookies to the browser. To do that, install the relay on another machine and
proceed to authenticate. Then copy the `cookies.json` file into the remote relay
working directory.

This might not work for all cases, but it might at least give you a few hints.

## Configure

Copy `.env.example` into a `.env` file, and make your adjustments.

## Start

> Please read the "Manual login" step before if not done yet. It is a required step.

```
npm start
```

## Use

Considering that you'll host it on `localhost:8080`.
All requests will be proxied as specified below. You will NOT need any token.

```
https://localhost:8080/epitest/*  =>  https://api.epitest.eu/*
```

For example, to get `https://api.epitest.eu/me/2021`,
you'll need to call `http://localhost:8080/epitest/me/2021`.

## Troubleshooting

#### How to make it work on a Raspberry Pi?

You might encounter issues with the bundled Chrome revision (fail to load due
to syntax error, etc.).

To make it work, you can download the `chromium-browser` package with your
system package manager, and specify `BROWSER_BINARY_PATH=/usr/bin/chromium-browser`
in your `.env` file to use this one instead of the bundled one.

In Raspbian, these commands should do it:
```bash
# install chromium
sudo apt-get install chromium-browser

# create .env if it does not exists
cp -n .env.example .env

# replace the browser binary path
sed -i 's/^BROWSER_BINARY_PATH=.*$/BROWSER_BINARY_PATH=\/usr\/bin\/chromium-browser/' .env
```

#### How to set it up with docker-compose?

> The docker-compose configuration provided is intented only for remote setups on servers.

Set it up, you will need to provide a `cookies.json` file generated with a local
install of the relay, made without Docker. See the Manual login section.

You must then clone this repo on the remote server and place the `cookies.json`
inside.

```bash
git clone https://github.com/norech/my-epitech-relay.git
cp /somewhere/cookies.json my-epitech-relay
```

And then run `docker-compose` commands to build and run.

```bash
# go to relay repository folder
cd my-epitech-relay

# build the image
docker-compose build

# start the container
docker-compose up    # add "-d" to start it in background (detached)
```
