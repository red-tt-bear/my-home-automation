// Fixes type issue in location type file
// node_modules\ring-client-api\lib\api\location.d.ts
// `getConnection(): Promise<SocketIOClient.Socket>;`
import { Socket as SocketIOSocket } from 'socket.io-client';
declare global {
    export namespace SocketIOClient {
        export type Socket = SocketIOSocket;
    }
}
