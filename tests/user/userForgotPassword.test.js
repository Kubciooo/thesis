/* eslint-disable no-undef */
const request = require('supertest');
const dbHandler = require('../db');
const app = require('../../app');

/**
 * @todo add tests for resetPassword/:token route
 */

describe('/forgotPassword route', () => {
  jest.setTimeout(20000);

  beforeAll(async () => {
    await dbHandler.connect();
    await request(app).post('/api/users/signup').send({
      login: 'kubcio',
      email: 'pawel@kubcio.com',
      password: 'kubcio',
      retypePassword: 'kubcio',
    });
  });

  afterAll(async () => {
    await dbHandler.clearDatabase();
    await dbHandler.closeDatabase();
  });

  it('Should return a password token for user', async () => {
    const res = await request(app).post('/api/users/forgotPassword').send({
      login: 'kubcio',
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('resetToken');
    expect(res.body.message).toEqual('success');
  });

  it('Should throw InvalidUser error', async () => {
    const res = await request(app).post('/api/users/forgotPassword').send({
      login: 'kubcio5',
    });
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual('Wrong login');
  });
});
