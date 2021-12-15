/* eslint-disable prefer-destructuring */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-undef */
const request = require('supertest');
const mongoose = require('mongoose');
const dbHandler = require('./db');
const app = require('../app');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');

describe('/promotions/product route', () => {
  jest.setTimeout(70000);

  let userToken;
  let categoryId;
  let shop;
  let product;

  beforeAll(async () => {
    await dbHandler.connect();
    const user = await request(app).post('/api/users/signup').send({
      login: 'kubcio',
      email: 'pawel@kubcio.com',
      password: 'kubcio',
      retypePassword: 'kubcio',
    });

    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        name: 'new category',
      });
    categoryId = categoryResponse.body.data.category._id;

    const shopResponse = await request(app)
      .post('/api/shops')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        name: 'xkom',
        mainUrl: 'https://www.x-kom.pl/',
      });

    const blockedShopRes = await request(app)
      .post('/api/shops')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        name: 'mediamarkt',
        mainUrl: 'https://www.mediamarkt.pl/',
      });

    const blockedShopsResponse = await request(app)
      .post('/api/users/blockedShops')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        shopId: blockedShopRes.body.data.shop._id,
        blocked: true,
      });
    user.blockedShops = blockedShopsResponse.body.data.blockedShops;

    shop = shopResponse.body.data.shop;

    const productResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        name: 'new product',
        category: categoryId,
        shop: shop._id,
        price: 1500,
        url: 'https://www.x-kom.pl/',
      });

    product = productResponse.body.data.product;
  });

  beforeEach(async () => {
    const user = await request(app).post('/api/users/login').send({
      login: 'kubcio',
      password: 'kubcio',
    });
    userToken = user.body.data.token;
  });

  afterEach(async () => await dbHandler.clearCollection('productpromotions'));
  afterAll(async () => await dbHandler.closeDatabase());

  it('Should get product promotions after autorizing', async () => {
    const res = await request(app)
      .get('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send();
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
  });

  it('Should add new product promotion', async () => {
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        userValidation: true,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'PERCENTAGE',
        expiresAt: Date.now() + 1000,
        percentage: 99,
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body).toHaveProperty('data');
  });

  it('Should try to add new product promotion', async () => {
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        userValidation: false,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'PERCENTAGE',
        expiresAt: Date.now() + 1000,
        percentage: 99,
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
  });

  it('Should throw notFoundError on add new product promotion', async () => {
    const randomKey = mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: randomKey,
        userValidation: true,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'PERCENTAGE',
        expiresAt: Date.now() + 1000,
        percentage: 99,
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
  });

  it('Should find 5 product promotions by product id', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/promotions/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'new product promotion',
          shop: shop._id,
          product: product._id,
          userValidation: true,
          type: 'COUPON',
          coupon: 'testing coupon',
          startingPrice: 1500,
          discountType: 'percentage',
          expiresAt: Date.now() + 10000,
          percentage: 99,
        });
    }
    const res = await request(app)
      .get(`/api/promotions/products/${product._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('productPromotions');
    expect(res.body.data.productPromotions).toHaveLength(5);
  });

  it('Should throw NotFoundError', async () => {
    const randomToken = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/promotions/products/${randomToken}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual(
      `Product with id ${randomToken} doesn't exist`
    );
    expect(res.body.name).toEqual('NotFoundError');
  });

  it('Should throw Cast Error', async () => {
    const randomToken = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/promotions/products/${randomToken}g`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual(`Invalid _id: ${randomToken}g.`);
    expect(res.body.name).toEqual('Cast Error');
  });

  it('wrong discount type - Should throw Validation Error', async () => {
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        userValidation: true,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'other promotion',
        expiresAt: Date.now() + 10000,
        percentage: 99,
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
    expect(res.body.name).toEqual('Validation Error');
    expect(res.body.message).toEqual(
      'Invalid input data. OTHER PROMOTION is not supported'
    );
  });

  it('wrong expiry date - Should throw Validation Error', async () => {
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        userValidation: true,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'percentage',
        expiresAt: Date.now() - 10,
        percentage: 99,
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
    expect(res.body.name).toEqual('Validation Error');
    expect(res.body.message).toContain(
      'Invalid input data. Validator failed for path `expiresAt`'
    );
  });

  it('require percentage on PERCENTAGE discout type - Should throw Validation Error', async () => {
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        type: 'COUPON',
        userValidation: true,
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'percentage',
        expiresAt: Date.now() + 10000,
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
    expect(res.body.name).toEqual('Validation Error');
    expect(res.body.message).toContain(
      'Invalid input data. Path `percentage` is required'
    );
  });

  it('Should find 2 product promotions', async () => {
    await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        userValidation: true,
        product: product._id,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'percentage',
        expiresAt: Date.now() + 10000,
        percentage: 99,
      });

    await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        userValidation: true,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'percentage',
        expiresAt: Date.now() + 10000,
        percentage: 99,
      });

    const res = await request(app)
      .get('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty('data');
  });

  it('Should follow percentage product promotion', async () => {
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        userValidation: true,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'percentage',
        expiresAt: Date.now() + 10000,
        percentage: 99,
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('productPromotion');
    expect(res.body.data.productPromotion).toHaveProperty('_id');

    const res2 = await request(app)
      .patch(`/api/promotions/products/${res.body.data.productPromotion._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK);

    const allProductsResponse = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(allProductsResponse.body.data.products[0]).toHaveProperty('price');
    expect(allProductsResponse.body.data.products[0].price).toEqual(15);
  });

  it('Should follow cash product promotion', async () => {
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        userValidation: true,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'cash',
        expiresAt: Date.now() + 10000,
        cash: 100,
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('productPromotion');
    expect(res.body.data.productPromotion).toHaveProperty('_id');

    const res2 = await request(app)
      .patch(`/api/promotions/products/${res.body.data.productPromotion._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK);

    const allProductsResponse = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(allProductsResponse.body.data.products[0]).toHaveProperty('price');
    expect(allProductsResponse.body.data.products[0].price).toEqual(1400);
  });

  it('Should throw BadRequestError on follow product promotion', async () => {
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        userValidation: true,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'percentage',
        expiresAt: Date.now() + 10000,
        percentage: 99,
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('productPromotion');
    expect(res.body.data.productPromotion).toHaveProperty('_id');

    const res2 = await request(app)
      .patch(`/api/promotions/products/${res.body.data.productPromotion._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK);

    const res3 = await request(app)
      .patch(`/api/promotions/products/${res.body.data.productPromotion._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res3.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
  });

  it('Should return NotFoundError on follow productPromotion', async () => {
    const randomToken = mongoose.Types.ObjectId();

    const res2 = await request(app)
      .patch(`/api/promotions/products/${randomToken}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
  });

  it('Should unfollow product promotion', async () => {
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        userValidation: true,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'percentage',
        expiresAt: Date.now() + 10000,
        percentage: 99,
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('productPromotion');
    expect(res.body.data.productPromotion).toHaveProperty('_id');

    const res2 = await request(app)
      .patch(`/api/promotions/products/${res.body.data.productPromotion._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK);

    const res3 = await request(app)
      .delete(`/api/promotions/products/${res.body.data.productPromotion._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res3.statusCode).toEqual(HTTP_STATUS_CODES.OK);
  });

  it('Should return NotFoundError on unfollow productPromotion', async () => {
    const randomToken = mongoose.Types.ObjectId();

    const res2 = await request(app)
      .delete(`/api/promotions/products/${randomToken}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
  });

  it('Should get one promotion followed by user', async () => {
    const res = await request(app)
      .post('/api/promotions/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new product promotion',
        shop: shop._id,
        product: product._id,
        userValidation: true,
        type: 'COUPON',
        coupon: 'testing coupon',
        startingPrice: 1500,
        discountType: 'percentage',
        expiresAt: Date.now() + 10000,
        percentage: 99,
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('productPromotion');
    expect(res.body.data.productPromotion).toHaveProperty('_id');

    const res2 = await request(app)
      .patch(`/api/promotions/products/${res.body.data.productPromotion._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK);

    const res3 = await request(app)
      .get(`/api/users/productPromotions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res3.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res3.body).toHaveProperty('data');
    expect(res3.body.data).toHaveProperty('productPromotions');
    expect(res3.body.data.productPromotions).toHaveLength(1);
  });
});
