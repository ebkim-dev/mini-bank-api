
import { createApp } from "./app";
import config from "./config/env";

const app = createApp();

app.listen(config.port, () => {
  console.log(
    `Mini Bank API is running on http://localhost:${config.port} in ${config.env} mode`
  );
});
