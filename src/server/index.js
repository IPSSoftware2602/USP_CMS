import { createServer, Model } from "miragejs";
import authServerConfig from "./auth-server";

export function makeMirageServer() {
  if (import.meta.env.MODE !== "development") {
    // ✅ Mirage will not run in production
    return;
  }

  createServer({
    models: {
      user: Model,
      product: Model,
      calendarEvent: Model,
    },

    factories: {},
    seeds() {},

    routes() {
      this.namespace = "api";

      // ✅ Allow real APIs to pass through
      this.passthrough("**/login");
      this.passthrough("**/users");
      this.passthrough("https://icom.ipsgroup.com.my/**");
      this.passthrough("https://api.uspizza.my/**");
      this.passthrough("https://pos.ipsgroup.com.my/**");
      this.passthrough("https://maps.googleapis.com/**");
      this.passthrough("https://www.google.com/maps/**");
      this.passthrough("**/order/**"); // ensures /order/list works fine

      // Optional: mock endpoints for local dev only
      // authServerConfig(this);

      this.timing = 400;
      this.passthrough();
    },
  });
}
