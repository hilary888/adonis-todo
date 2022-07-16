import { test } from "@japa/runner";

test("health_check returns status 200 and body", async ({ client }) => {
  const response = await client.get("/api/v1/health_check");

  response.assertStatus(200);
});
