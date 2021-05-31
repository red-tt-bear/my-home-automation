# my-home-automation
This project is a script I plan to run on a raspberry pi on my home network.  

This needs to be run on the same network as the kasa device(s) that you want to turn on

# Building notes
Originally would run with ts-node but would not build, adding some dependencies and global types fixed the issues
* Installed
  * ts-essentials
  * socket.io-client
  * homebridge
* Globals
  * Made SocketIOClient a global module

#### Environment
| Environment variable | Description | Default value |
| --- | --- | --- |
| RING_EMAIL | Email to login to ring with | 'email@email.com' |
| RING_PASSWORD | Password for ring account | 'password' |
| PORCH_ALIAS | The name of the kasa device to connect to | 'Porch Light' |
