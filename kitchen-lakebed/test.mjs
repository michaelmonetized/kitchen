import { WebSocket } from 'ws';

const ws = new WebSocket('ws://localhost:3000/_lakebed/ws');

ws.on('open', () => {
  let msgId = 1;

  function send(msg) {
    ws.send(JSON.stringify({ ...msg, id: msgId++ }));
  }

  // Auth first
  send({ type: 'auth', token: 'guest:mh' });

  // Wait a bit, then mutate
  setTimeout(() => {
    send({ type: 'mutation', name: 'updateUsername', args: ['mh'] });
  }, 100);

  setTimeout(() => {
    send({ type: 'mutation', name: 'createProject', args: ['kitchen'] });
  }, 200);

  setTimeout(() => {
    send({ type: 'query', name: 'getProjectByOwnerAndName', args: ['mh', 'kitchen'] });
  }, 300);
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 1000);
