const request = require("supertest");
const mongoose = require("mongoose");
const dbHandler = require("./db");
const app = require("../app");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");

describe("/product route", () => {
  jest.setTimeout(20000);

  let userToken;
  let categoryId;

  beforeAll(async () => {
    await dbHandler.connect();
    const user = await request(app).post("/api/users/signup").send({
      login: "kubcio",
      email: "pawel@kubcio.com",
      password: "kubcio",
      retypePassword: "kubcio",
    });

    const categoryResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${user.body.data.token}`)
      .send({
        name: "new category",
      });
    categoryId = categoryResponse.body.data.category._id;
  });

  beforeEach(async () => {
    const user = await request(app).post("/api/users/login").send({
      login: "kubcio",
      password: "kubcio",
    });
    userToken = user.body.data.token;
  });

  afterEach(async () => await dbHandler.clearCollection("products"));
  afterAll(async () => await dbHandler.closeDatabase());

  it("Should get products after autorizing", async () => {
    const res = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send();
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
  });

  it("Should add new product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new product",
        category: categoryId,
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body).toHaveProperty("data");
  });

  it("Should find product by id", async () => {
    const productResponse = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new product",
        category: categoryId,
      });
    const product = productResponse.body.data.product;

    const res = await request(app)
      .get(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("product");
    expect(res.body.data.product).toHaveProperty("_id");
    expect(res.body.data.product._id).toEqual(product._id);
  });

  it("Should throw NotFoundError", async () => {
    const randomToken = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/products/${randomToken}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.body).not.toHaveProperty("data");
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toEqual(
      `Product with id ${randomToken} doesn't exist`
    );
    expect(res.body.name).toEqual("NotFoundError");
  });

  it("Should throw Cast Error", async () => {
    const randomToken = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/products/${randomToken}g`)
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
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new product",
        category: categoryId,
      });

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new product",
        category: categoryId,
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty("data");
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("message");
    expect(res.body.name).toEqual("Unique Duplicates Error");
    expect(res.body.message).toEqual(
      'The value "new product" already exists in DB - please use other value'
    );
  });

  it("product name too long - Should throw Validation Error", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new product with a name that is way way waaaaay tooooooo long",
        category: categoryId,
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

  it("Should find 2 products", async () => {
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "new product",
        category: categoryId,
      });

    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "second new product",
        category: categoryId,
      });

    const res = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("products");
    expect(res.body.data.products).toHaveLength(2);
  });
});
