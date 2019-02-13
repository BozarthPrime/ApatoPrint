# ![ApatoPrint-header](logo/ApatoPrint-header.png)

A Slack bot to remotely control your OctoPrint instance on a Raspberry Pi.

## How it works
ApatoPrint is a nodejs application that runs alongside OctoPrint that connects to the OctoPrint API and the Slack API as a Slack bot. You set up a private channel for it to accept commands from and only add in people you would like to be able to control the printers. From there you can send it commands to do various things like stopping, starting, and getting status updates.

# Setup

> NOTE: Because of various limitations on nodejs version support on older Raspberry Pis this requires a Pi version 2 or greater if you would like to use camera functionality

## Setup OctoPrint on your Raspberry Pi
If you have already done this just skip this section and move on to [Setup ApatoPrint](#setup-apatoprint).

You have a few options for this. If you are starting fresh you can use the OctoPi Raspbian image you can flash to your SD card that has OctoPrint installed already for you or you can download the source onto a Pi you already have setup and install it from source. Both methods are outlined here https://octoprint.org/download/

## Setup ApatoPrint<a name="setup-apatoprint"></a>

### Install Node.js
If you do not already have Node.js installed on your Raspberry Pi you can find directions on how to install it here https://github.com/nodesource/distributions. You will need at least version 8 but I would recomend installing the latest stable version.

### Install ApatoPrint
1. Change directory to be alongside your OctoPrint install (most likely this is your home directory so `cd ~`)
1. Get a copy of ApatoPrint via a git clone or downloading a zip from here 
	1. Clone the latest release of this repo into a folder named "ApatoPrint" `git clone --branch v1.1.0 https://github.com/BozarthPrime/ApatoPrint.git ApatoPrint`
	1. Or download the [latest release](https://github.com/BozarthPrime/ApatoPrint/releases) zip and extract it into a folder named "ApatoPrint"
1. Change directory into the ApatoPrint folder `cd ApatoPrint`
1. Install dependencies by running `npm install`

### Configure ApatoPrint
Open the `settings.json` file and adjust the settings to fit your environment.

#### Get OctoPrint API key
1. Open OctoPrint settings
1. Select API from the left side menu
1. Make sure that the "Enable" box is checked
1. Copy the "API Key" field into the `octoprint.apiKey` field in `settings.json`

#### Get a Slack Bot Token
1. Go to https://my.slack.com/services/new/bot
1. Set a name for your bot. Ex. "ApatoPrint"
1. Click "Add bot integration"
1. Copy your "API Token" into the `slack.token` field in `settings.json`

#### Setup your control cannel in Slack
To make your printer control secure you are going to want to make a private channel between you and your printer where it will accept commands from.

1. In Slack click "+" next to Channels
1. Name your channel something. Ex. "printer-control"
1. In the "Send invites to" field add your bot that you created for ApatoPrint
1. Click "Create Channel"
1. Open your private channel in a browser and copy the ID in the last segment of the address (it should be 8 alpha-numeric characters. Do not include the trailing slash). Copy that ID into the `slack.commandChannelId` field in `settings.json`
1. Copy your channel name into the `slack.commandChannelName` field in `settings.json`

#### Other settings
The other settings are self explanatory in the names of them. If you are running this on the raspberry pi with OctoPrint as recomended `octoprint.address` will be "localhost". If you are running it on something else you will want to use the IP address of the raspberry pi running OctoPrint.

## Running ApatoPrint
From the main Apatoprint directory run `npm start`

# Commands

## help
Print all commands

Syntax:
```
help
```

## print
Print a specified file

Syntax:
```
print <file name>
```

## pause
Pause a running print

Syntax:
```
pause
```

## resume
Resume a running print

Syntax:
```
resume
```

## cancel
Cancel the running print

Syntax:
```
cancel
```

## jobstatus
Get the status of the current job

Syntax:
```
jobstatus
```

## jobpicture
Get a picture of the current job

Syntax:
```
jobpicture
```

## printerstatus
Get the status of the printer

Syntax:
```
printerstatus
```

## getallfiles
Display all the files on the server

Syntax:
```
getallfiles
```

## connect
Connect to a printer

Syntax:
```
connect
```

## disconnect
Disconnect the printer

Syntax:
```
disconnect
```

# Other info

## Special thanks
[星球](https://openclipart.org/user-detail/%E6%98%9F%E7%90%83) - For posting and open-sourcing your art.
