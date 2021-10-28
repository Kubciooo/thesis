const request = require("supertest");
const mongoose = require("mongoose");
const dbHandler = require("./db");
const app = require("../app");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");

describe("/shop route", () => {
  jest.setTimeout(20000);

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

  afterEach(async () => await dbHandler.clearCollection("shops"));
  afterAll(async () => await dbHandler.closeDatabase());

  it("Should get shops after autorizing", async () => {
    const res = await request(app)
      .get("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send();
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
  });

  it("Should add new shop", async () => {
    const res = await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new shop",
        mainUrl: "https://www.x-kom.pl/",
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body).toHaveProperty("data");
  });

  it("Should find shop by id", async () => {
    const shopResponse = await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new shop",
        mainUrl: "https://www.x-kom.pl/",
      });
    const shop = shopResponse.body.data.shop;

    const res = await request(app)
      .get(`/api/shops/${shop._id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("shop");
    expect(res.body.data.shop).toHaveProperty("_id");
    expect(res.body.data.shop._id).toEqual(shop._id);
  });

  it("Should throw NotFoundError", async () => {
    const randomToken = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/shops/${randomToken}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.body).not.toHaveProperty("data");
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toEqual(
      `Shop with id ${randomToken} doesn't exist`
    );
    expect(res.body.name).toEqual("NotFoundError");
  });

  it("Should throw Cast Error", async () => {
    const randomToken = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/shops/${randomToken}g`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty("data");
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toEqual(`Invalid _id: ${randomToken}g.`);
    expect(res.body.name).toEqual("Cast Error");
  });

  it("Should throw Unique Duplicates Error", async () => {
    await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new shop",
        mainUrl: "https://www.x-kom.pl/",
      });

    const res = await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new shop 2",
        mainUrl: "https://www.x-kom.pl/",
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty("data");
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("message");
    expect(res.body.name).toEqual("Unique Duplicates Error");
    expect(res.body.message).toEqual(
      'The value "https://www.x-kom.pl/" already exists in DB - please use other value'
    );
  });

  it("shop name too long - Should throw Validation Error", async () => {
    const res = await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new shop with a name that is way way waaaaay tooooooo long",
        mainUrl: "https://www.x-kom.pl/",
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty("data");
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("message");
    expect(res.body.name).toEqual("Validation Error");
    expect(res.body.message).toEqual(
      "Invalid input data. The name must have at most 40 characters"
    );
  });

  it("Path is required - Should throw Validation Error", async () => {
    const res = await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new shop",
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty("data");
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("message");
    expect(res.body.name).toEqual("Validation Error");
    expect(res.body.message).toEqual(
      "Invalid input data. Path `mainUrl` is required."
    );
  });

  it("Wrong shop url - Should throw Validation Error", async () => {
    const res = await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new shop",
        mainUrl: 'xkom',
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty("data");
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("message");
    expect(res.body.name).toEqual("Validation Error");
    expect(res.body.message).toEqual(
      "Invalid input data. Validator failed for path `mainUrl` with value `xkom`"
    );
  });

  it("Should find 2 shops", async () => {
    await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new shop",
        mainUrl: "https://www.x-kom.pl/",
      });

    await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "second new shop",
        mainUrl: "https://www.oleole.pl/",
      });

    const res = await request(app)
      .get("/api/shops")
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("shops");
    expect(res.body.data.shops).toHaveLength(2);
  });
});
