const request = require("supertest");
const dbHandler = require("./db");
const app = require("../app");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");

describe("Should throw InvalidUser error for authorization", () => {
  jest.setTimeout(35000);
  let userToken;
  beforeAll(async () => {
    await dbHandler.connect();
    await request(app).post("/api/users/signup").send({
      login: "kubcio",
      email: "pawel@kubcio.com",
      password: "kubcio",
      retypePassword: "kubcio",
    });
  });

  beforeEach(async () => {
    const user = await request(app).post("/api/users/login").send({
      login: "kubcio",
      password: "kubcio",
    });
    userToken = user.body.data.token;
  });
  afterAll(async () => {
    await dbHandler.clearDatabase();
    await dbHandler.closeDatabase();
  });

  const routes = [
    "categories",
    "shops",
    "products",
    "promotions/shops",
    "promotions/products",
  ];

  for (const route of routes) {
    it(`Should throw InvalidUser error for /${route}`, async () => {
      const res = await request(app).get(`/api/${route}`).send();
      expect(res.statusCode).toEqual(HTTP_STATUS_CODES.INVALID);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("name");
      expect(res.body).toHaveProperty("status");
      expect(res.body.message).toEqual(
        "Please log in to get access to this route"
      );
      expect(res.body.name).toEqual("InvalidUser");
    });
  }

  for (const route of routes) {
    it(`Should authorize route for /${route}`, async () => {
      const res = await request(app)
        .get(`/api/${route}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send();
      expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    });
  }

  for (const route of routes) {
    it(`Should throw Token Expired Error for route /${route}`, async () => {
      await new Promise((r) => setTimeout(r, 31000));

      const res = await request(app)
        .get(`/api/${route}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send();

      expect(res.statusCode).toEqual(HTTP_STATUS_CODES.INVALID);
    });
  }

  for (const route of routes) {
    it(`Should throw JsonWebToken Error for route /${route}`, async () => {
      await new Promise((r) => setTimeout(r, 31000));

      const res = await request(app)
        .get(`/api/${route}`)
        .set("Authorization", `Bearer ${userToken}x`)
        .send();

      expect(res.statusCode).toEqual(HTTP_STATUS_CODES.INVALID);
    });
  }
});
