const request = require("supertest");
const dbHandler = require("../db");
const app = require("../../app");

/**
 * @todo add tests for updatePassword route
 */
describe("/login route", () => {
  jest.setTimeout(20000);

  beforeAll(async () => {
    await dbHandler.connect();
    await request(app).post("/api/users/signup").send({
      login: "kubcio",
      email: "pawel@kubcio.com",
      password: "kubcio",
      retypePassword: "kubcio",
    });
  });
  afterAll(async () => {
    await dbHandler.clearDatabase();
    await dbHandler.closeDatabase();
  });

  it("Should login as kubcio", async () => {
    const res = await request(app).post("/api/users/login").send({
      login: "kubcio",
      password: "kubcio",
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("data");
    expect(res.body.message).toEqual("success");
  });

  it("Should throw InvalidUser error", async () => {
    const res = await request(app).post("/api/users/login").send({
      login: "kubcio",
      password: "kubcio3",
    });
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toEqual("Wrong login or password");
  });
});
