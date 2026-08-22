import { createClient } from 'redis';

async function flush() {
  const client = createClient();
  await client.connect();
  await client.flushAll();
  console.log("Redis cache flushed successfully.");
  await client.disconnect();
}

flush().catch(console.error);
