const request = require("supertest");
const dbHandler = require("./db");
const app = require("../app");

describe("/signup route", () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clearDatabase());
  afterAll(async () => await dbHandler.closeDatabase());
  jest.setTimeout(20000);

  it("Should create a new user", async () => {
    const res = await request(app).post("/api/users/signup").send({
      login: "kubcio",
      email: "pawel@kubcio.com",
      password: "kubcio",
      retypePassword: "kubcio",
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("data");
    expect(res.body.message).toEqual("success");
  });

  it("Should throw Unique Duplicates Error", async () => {
    await request(app).post("/api/users/signup").send({
      login: "kubcio",
      email: "pawel@kubcio.com",
      password: "kubcio",
      retypePassword: "kubcio",
    });
    const res = await request(app).post("/api/users/signup").send({
      login: "kubcio",
      email: "pawel@kubcio.com",
      password: "kubcio",
      retypePassword: "kubcio",
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.name).toEqual('Unique Duplicates Error');
    expect(res.body.message).toEqual("The value \"kubcio\" already exists in DB - please use other value");
  });

  it("Should throw PasswordsAreSameError", async () => {
    const res = await request(app).post("/api/users/signup").send({
      login: "kubcio",
      email: "pawel@kubcio.com",
      password: "kubcio",
      retypePassword: "kubcio2",
    });
    expect(res.statusCode).toEqual(403);
    expect(res.body.name).toEqual('PasswordsAreSameError');
    expect(res.body.message).toEqual("Passwords are not the same");
  });

  it("Should throw PasswordsAreSameError", async () => {
    const res = await request(app).post("/api/users/signup").send({
      login: "kubcio",
      email: "pawel@kubcio.com",
      password: "kubcio",
      retypePassword: "kubcio2",
    });
    expect(res.statusCode).toEqual(403);
    expect(res.body.name).toEqual('PasswordsAreSameError');
    expect(res.body.message).toEqual("Passwords are not the same");
  });
});
