/* eslint-disable no-undef */
const request = require('supertest');
const mongoose = require('mongoose');
const dbHandler = require('./db');
const app = require('../app');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');

describe('/category route', () => {
  jest.setTimeout(20000);

  let userToken;
  beforeAll(async () => {
    await dbHandler.connect();
    await request(app).post('/api/users/signup').send({
      login: 'kubcio',
      email: 'pawel@kubcio.com',
      password: 'kubcio',
      retypePassword: 'kubcio',
    });
  });

  beforeEach(async () => {
    const user = await request(app).post('/api/users/login').send({
      login: 'kubcio',
      password: 'kubcio',
    });
    userToken = user.body.data.token;
  });

  afterEach(async () => await dbHandler.clearCollection('categories'));
  afterAll(async () => await dbHandler.closeDatabase());

  it('Should get categories after autorizing', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send();
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
  });

  it('Should add new category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new category',
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body).toHaveProperty('data');
  });

  it('Should find category by id', async () => {
    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new category',
      });
    const { category } = categoryResponse.body.data;

    const res = await request(app)
      .get(`/api/categories/${category._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('category');
    expect(res.body.data.category).toHaveProperty('_id');
    expect(res.body.data.category._id).toEqual(category._id);
  });

  it('Should throw NotFoundError', async () => {
    const randomToken = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/categories/${randomToken}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual(
      `Category with id ${randomToken} doesn't exist`
    );
    expect(res.body.name).toEqual('NotFoundError');
  });

  it('Should throw Cast Error', async () => {
    const randomToken = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/categories/${randomToken}g`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual(`Invalid _id: ${randomToken}g.`);
    expect(res.body.name).toEqual('Cast Error');
  });

  it('Should throw Unique Duplicates Error', async () => {
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new category',
      });

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new category',
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
    expect(res.body.name).toEqual('Unique Duplicates Error');
    expect(res.body.message).toEqual(
      'The value "new category" already exists in DB - please use other value'
    );
  });

  it('category name too long - Should throw Validation Error', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new category with a name that is way way waaaaay tooooooo long',
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
    expect(res.body.name).toEqual('Validation Error');
    expect(res.body.message).toEqual(
      'Invalid input data. The name must have at most 40 characters'
    );
  });

  it('Should find 2 categories', async () => {
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new category',
      });

    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'second new category',
      });

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('categories');
    expect(res.body.data.categories).toHaveLength(2);
  });
});
