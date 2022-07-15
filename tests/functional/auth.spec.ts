import { test } from '@japa/runner'

test.group('Auth', () => {
  test("creates user with correct registration details", async ({ client }) => {
    const newUserPayload = {
      "email": "hil@mail.com",
      "username": "heythere",
      "password": "secretsecret",
      "password_confirmation": "secretsecret"
    };

    const response = await client
      .post("/api/v1/register")
      .json(newUserPayload);

    response.assertStatus(201);

  })
})
