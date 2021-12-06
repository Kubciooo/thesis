/* eslint-disable prefer-destructuring */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-undef */
const request = require('supertest');
const mongoose = require('mongoose');
const dbHandler = require('./db');
const app = require('../app');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');

describe('/folder route', () => {
  jest.setTimeout(70000);

  let userToken;
  let shop;
  let blockedShop;

  beforeAll(async () => {
    await dbHandler.connect();
    const user = await request(app).post('/api/users/signup').send({
      login: 'kubcio',
      email: 'pawel@kubcio.com',
      password: 'kubcio',
      retypePassword: 'kubcio',
    });

    userToken = user.body.data.token;

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

    blockedShop = blockedShopRes.body.data.shop;
    shop = shopResponse.body.data.shop;
  });

  beforeEach(async () => {
    const user = await request(app).post('/api/users/login').send({
      login: 'kubcio',
      password: 'kubcio',
    });
    userToken = user.body.data.token;
  });

  afterEach(async () => await dbHandler.clearCollection('folders'));
  afterAll(async () => await dbHandler.closeDatabase());

  it('Should get likes', async () => {
    const res = await request(app)
      .get('/api/users/likes')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.status).toBe(HTTP_STATUS_CODES.OK);
  });

  it('Should change likes', async () => {
    const res = await request(app)
      .post('/api/users/likes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        likes: 100,
      });

    expect(res.status).toBe(HTTP_STATUS_CODES.OK_POST);
  });

  it('Should get blocked shops', async () => {
    const res = await request(app)
      .get('/api/users/blockedShops')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.status).toBe(HTTP_STATUS_CODES.OK);
  });

  it('Should add new blockedShop and remove it', async () => {
    const res = await request(app)
      .post('/api/users/blockedShops')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        shopId: shop._id,
        blocked: true,
      });

    expect(res.status).toBe(HTTP_STATUS_CODES.OK_POST);
    expect(res.body.data.blockedShops.length).toBe(2);

    const res2 = await request(app)
      .post('/api/users/blockedShops')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        shopId: shop._id,
        blocked: false,
      });

    expect(res2.status).toBe(HTTP_STATUS_CODES.OK_POST);
    expect(res2.body.data.blockedShops.length).toBe(1);
  });

  it('Should get favourite product', async () => {
    const res = await request(app)
      .get('/api/users/favourites/product')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.status).toBe(HTTP_STATUS_CODES.OK);
  });

  it('Should get favourite folder', async () => {
    const res = await request(app)
      .get('/api/users/favourites/folder')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.status).toBe(HTTP_STATUS_CODES.OK);
  });

  it('Should get followed products', async () => {
    const res = await request(app)
      .get('/api/users/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.status).toBe(HTTP_STATUS_CODES.OK);
  });
});
