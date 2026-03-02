import { connectRedis, disconnectRedis, redisClient } from "./redisClient";

async function main() {
  await connectRedis();
  await redisClient.set("test", "value", { EX: 10 });
  const val = await redisClient.get("test");
  console.log(val);
  await disconnectRedis();
}

main();