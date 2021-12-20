/* eslint-disable no-await-in-loop */
/* eslint-disable no-undef */
const request = require('supertest');
const mongoose = require('mongoose');
const dbHandler = require('./db');
const app = require('../app');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');

describe('/promotions/shop route', () => {
  jest.setTimeout(20000);

  let userToken;
  let categoryId;
  let shop;

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
        name: 'new shop',
        mainUrl: 'https://www.x-kom.pl/',
      });

    // eslint-disable-next-line prefer-destructuring
    shop = shopResponse.body.data.shop;
  });

  beforeEach(async () => {
    const user = await request(app).post('/api/users/login').send({
      login: 'kubcio',
      password: 'kubcio',
    });
    userToken = user.body.data.token;
  });

  afterEach(async () => await dbHandler.clearCollection('shoppromotions'));
  afterAll(async () => await dbHandler.closeDatabase());

  it('Should get shop promotions after autorizing', async () => {
    const res = await request(app)
      .get('/api/promotions/shops')
      .set('Authorization', `Bearer ${userToken}`)
      .send();
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
  });

  it('Should add new shop promotion', async () => {
    const res = await request(app)
      .post('/api/promotions/shops')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new shop promotion',
        url: shop.mainUrl,
        category: categoryId,
        shop: shop._id,
        type: 'COUPON',
        coupon: 'testing coupon',
        discountType: 'percentage',
        expiresAt: Date.now() + 10,
        percentage: 99,
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body).toHaveProperty('data');
  });

  it('Should find 5 shop promotions by shop id', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/promotions/shops')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'new shop promotion',
          url: shop.mainUrl,
          category: categoryId,
          shop: shop._id,
          type: 'COUPON',
          coupon: 'testing coupon',
          discountType: 'percentage',
          expiresAt: Date.now() + 1000,
          percentage: 99,
        });
    }
    const res = await request(app)
      .get(`/api/promotions/shops/${shop._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('shopPromotions');
    expect(res.body.data.shopPromotions).toHaveLength(5);
  });

  it('Should throw NotFoundError', async () => {
    const randomToken = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/promotions/shops/${randomToken}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual(
      `Shop with id ${randomToken} doesn't exist`
    );
    expect(res.body.name).toEqual('NotFoundError');
  });

  it('Should throw Cast Error', async () => {
    const randomToken = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/promotions/shops/${randomToken}g`)
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
      .post('/api/promotions/shops')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new shop promotion',
        url: shop.mainUrl,
        category: categoryId,
        shop: shop._id,
        type: 'OTHER PROMOTION',
        coupon: 'testing coupon',
        discountType: 'percentage',
        expiresAt: Date.now() + 10,
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
      .post('/api/promotions/shops')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new shop promotion',
        url: shop.mainUrl,
        category: categoryId,
        shop: shop._id,
        type: 'COUPON',
        coupon: 'testing coupon',
        discountType: 'percentage',
        expiresAt: Date.now() - 1,
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
      .post('/api/promotions/shops')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new shop promotion',
        url: shop.mainUrl,
        category: categoryId,
        shop: shop._id,
        type: 'COUPON',
        coupon: 'testing coupon',
        discountType: 'percentage',
        expiresAt: Date.now() + 1,
        cash: 99,
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
  it('Should find 2 shop promotions', async () => {
    await request(app)
      .post('/api/promotions/shops')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new shop promotion',
        url: shop.mainUrl,
        category: categoryId,
        shop: shop._id,
        type: 'COUPON',
        coupon: 'testing coupon',
        discountType: 'percentage',
        expiresAt: Date.now() + 10,
        percentage: 99,
      });

    await request(app)
      .post('/api/promotions/shops')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new shop promotion',
        url: shop.mainUrl,
        category: categoryId,
        shop: shop._id,
        type: 'COUPON',
        coupon: 'testing coupon',
        discountType: 'percentage',
        expiresAt: Date.now() + 10,
        percentage: 99,
      });

    const res = await request(app)
      .get('/api/promotions/shops')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty('data');
  });
});
