import feathers from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';
import io from 'socket.io-client';

const socket = io('http://localhost:3030', { transports: ['websocket'] });

const feathersClient = feathers();

feathersClient.configure(socketio(socket));

export default feathersClient;
