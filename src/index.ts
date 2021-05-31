import dotenv from 'dotenv';
dotenv.config();

import { Client, Device, Plug } from 'tplink-smarthome-api';
import { RingApi } from 'ring-client-api';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { runRingAuth } from './ring-auth';
// Doesn't have type defs
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sound = require('sound-play');

const porchAlias = process.env.PORCH_ALIAS;
if (_.isNil(porchAlias)) {
    console.error('Porch alias not configured');
    process.exit(1);
}
const devices: {
    [alias: string]: Device;
} = {};

const client = new Client();

// Look for devices, log to console, and turn them on
client.startDiscovery().on('device-new', (device: Device) => {
    console.log(`Kasa discovered: ${device.alias}`);
    devices[device.alias] = device;
});

//This boolean is used to blcok turn off if it wasn't turned on by the script
let shouldTurnOff = false;
const turnOffPorch = _.debounce(() => {
    if (_.isNil(devices[porchAlias])) {
        console.error('light not found yet');
    }
    (devices[porchAlias] as Plug).setPowerState(false);
    shouldTurnOff = false;
}, 30000, {
    trailing: true,
});

const porchHandler = async () => {
    const isPorchOn = await (devices[porchAlias] as Plug).getPowerState();
    if (!isPorchOn) {
        shouldTurnOff = true;
        (devices[porchAlias] as Plug).setPowerState(true);
    }
    // separate if statement so it get's debounced
    if (shouldTurnOff) {
        turnOffPorch();
    }
};

(async () => {
    await runRingAuth();

    const tokenPath = 'token.txt';
    const refreshToken: string | undefined = fs.existsSync(tokenPath) ? await (await fs.promises.readFile(tokenPath)).toString() : undefined;
    if (_.isNil(refreshToken)) {
        console.error('Missing ring refresh token');
        process.exit(1);
    }

    const ringApi = new RingApi({
        refreshToken: refreshToken,
        cameraDingsPollingSeconds: 2,
        // cameraStatusPollingSeconds: 2,
    });

    const locations = await ringApi.getLocations();
    // I specifically only have 1 location, could expand if need be
    const location = locations[0];
    // I specifcally have one doorbell, could expand if need be
    const camera = location.cameras[0];

    camera.onDoorbellPressed.subscribe(async observer => {
        console.log(`Doorbell pressed ${observer} ${new Date()}`);
        porchHandler();
        sound.play(path.resolve('assets/ding.mp3'))
        .then(() => console.log('ring sound played'))
        // Anything can be thrown so this should be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((err: any) => console.error('ring sound errored',err));        
    });

    camera.onMotionDetected.subscribe(observer => {
        console.log(`Motion detected ${observer.valueOf()} ${new Date()}`);
        porchHandler();
    });

    fs.promises.writeFile('checkin.txt', new Date().toString())
    .catch(err => console.error('Failed to write checkin', err));
})();
