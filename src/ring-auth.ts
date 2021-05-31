import { RingRestClient } from 'ring-client-api/lib/api/rest-client';
import { requestInput } from 'ring-client-api/lib/api/util';
import fs from 'fs';
import _ from 'lodash';
import { AuthTokenResponse } from 'ring-client-api';

export const runRingAuth = async (): Promise<void> => {
    const tokenPath = 'token.txt';
    const refreshToken: string | undefined = fs.existsSync(tokenPath) ? await (await fs.promises.readFile(tokenPath)).toString() : undefined;
    const { RING_EMAIL, RING_PASSWORD } = process.env;
    if (_.isNil(RING_EMAIL) || _.isNil(RING_PASSWORD)) {
        if (fs.existsSync(tokenPath)) {
            console.warn('Missing email and / or password, but there is an auth token. using existing');
            return;
        }
        throw new Error('Missing email and / or password');
    }
    const restClient = new RingRestClient({
        email: RING_EMAIL,
        password: RING_PASSWORD,
        refreshToken: refreshToken
    });
    const getAuthWith2fa = async (): Promise<AuthTokenResponse> => {
        const code = await requestInput('2fa Code: ');
        try {
            return await restClient.getAuth(code);
        } catch (_) {
            console.log('Incorrect 2fa code. Please try again.');
            return getAuthWith2fa();
        }
    };
    const auth = await restClient.getCurrentAuth()
        .catch((e) => {
            if (restClient.using2fa) {
                console.log(
                    'Ring 2fa or verification code is enabled.  Please enter code from the text/email.'
                );
                return getAuthWith2fa();
            }

            console.error(e);
            process.exit(1);
        });
    await fs.promises.writeFile(tokenPath, auth.refresh_token);
    console.log('done');
};
