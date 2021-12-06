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
  let categoryId;
  let shop;
  let product;
  let product2;

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
        price: 100,
        url: 'https://www.x-kom.pl/',
      });

    const product2Response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        name: 'new product 2',
        category: categoryId,
        shop: shop._id,
        price: 100,
        url: 'https://www.x-kom.pl/product2',
      });

    product = productResponse.body.data.product;
    product2 = product2Response.body.data.product;
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

  it('Should create a new folder and get it', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new folder',
        products: [product._id],
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body.data).toHaveProperty('folder');
    expect(res.body.data.folder).toHaveProperty('_id');

    const getRes = await request(app)
      .get(`/api/folders`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();
    expect(getRes.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(getRes.body.data).toHaveProperty('folders');
    expect(getRes.body.data.folders).toHaveLength(1);
    expect(getRes.body.data.folders[0]).toHaveProperty('_id');
    expect(getRes.body.data.folders[0]).toHaveProperty('name');
    expect(getRes.body.data.folders[0].name).toEqual('new folder');
    expect(getRes.body.data.folders[0]).toHaveProperty('products');
    expect(getRes.body.data.folders[0].products).toHaveLength(1);
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('_id');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('name');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('price');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('url');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('shop');
  });

  it('Should not create a new folder if products are not provided', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new folder',
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual('Folder must have at least one product');
  });

  it('Should create a new folder and set it as favourite', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new folder',
        products: [product._id],
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body.data).toHaveProperty('folder');
    expect(res.body.data.folder).toHaveProperty('_id');

    const getRes = await request(app)
      .get(`/api/folders`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();
    expect(getRes.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(getRes.body.data).toHaveProperty('folders');
    expect(getRes.body.data.folders).toHaveLength(1);
    expect(getRes.body.data.folders[0]).toHaveProperty('_id');
    expect(getRes.body.data.folders[0]).toHaveProperty('name');
    expect(getRes.body.data.folders[0].name).toEqual('new folder');
    expect(getRes.body.data.folders[0]).toHaveProperty('products');
    expect(getRes.body.data.folders[0].products).toHaveLength(1);
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('_id');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('name');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('price');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('url');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('shop');

    const res2 = await request(app)
      .post(`/api/users/favourites/folder`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        folderId: res.body.data.folder._id,
      });

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res2.body.data).toHaveProperty('favouriteFolder');
    expect(res2.body.data.favouriteFolder).toHaveProperty('_id');
    expect(res2.body.data.favouriteFolder).toHaveProperty('name');
    expect(res2.body.data.favouriteFolder.name).toEqual('new folder');

    const getRes2 = await request(app)
      .get(`/api/users/favourites/folder`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();
    expect(getRes2.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(getRes2.body.data).toHaveProperty('favouriteFolder');
    expect(getRes2.body.data.favouriteFolder).toHaveProperty('_id');
    expect(getRes2.body.data.favouriteFolder).toHaveProperty('name');
    expect(getRes2.body.data.favouriteFolder.name).toEqual('new folder');
  });

  it('Should not create a new folder if name is not provided', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        products: [product._id],
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual(
      'Invalid input data. Path `name` is required.'
    );
  });

  it('Should create and delete folder', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new folder',
        products: [product._id],
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body.data).toHaveProperty('folder');
    expect(res.body.data.folder).toHaveProperty('_id');

    const getRes = await request(app)
      .get(`/api/folders`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();
    expect(getRes.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(getRes.body.data).toHaveProperty('folders');
    expect(getRes.body.data.folders).toHaveLength(1);
    expect(getRes.body.data.folders[0]).toHaveProperty('_id');
    expect(getRes.body.data.folders[0]).toHaveProperty('name');
    expect(getRes.body.data.folders[0].name).toEqual('new folder');
    expect(getRes.body.data.folders[0]).toHaveProperty('products');
    expect(getRes.body.data.folders[0].products).toHaveLength(1);
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('_id');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('name');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('price');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('url');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('shop');

    const res2 = await request(app)
      .delete(`/api/folders/${res.body.data.folder._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();
    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK);
  });

  it('Should create a folder and add a product2 to it', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new folder',
        products: [product._id],
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body.data).toHaveProperty('folder');
    expect(res.body.data.folder).toHaveProperty('_id');

    const getRes = await request(app)
      .get(`/api/folders`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();
    expect(getRes.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(getRes.body.data).toHaveProperty('folders');
    expect(getRes.body.data.folders).toHaveLength(1);
    expect(getRes.body.data.folders[0]).toHaveProperty('_id');
    expect(getRes.body.data.folders[0]).toHaveProperty('name');
    expect(getRes.body.data.folders[0].name).toEqual('new folder');
    expect(getRes.body.data.folders[0]).toHaveProperty('products');
    expect(getRes.body.data.folders[0].products).toHaveLength(1);
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('_id');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('name');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('price');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('url');
    expect(getRes.body.data.folders[0].products[0]).toHaveProperty('shop');

    const res2 = await request(app)
      .put(`/api/folders/${res.body.data.folder._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: product2._id,
      });
    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res2.body.data).toHaveProperty('folder');
    expect(res2.body.data.folder).toHaveProperty('_id');
    expect(res2.body.data.folder).toHaveProperty('products');
    expect(res2.body.data.folder.products).toHaveLength(2);
  });

  it('Should not add a product to folder if product does not exist', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new folder',
        products: [product._id],
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body.data).toHaveProperty('folder');
    expect(res.body.data.folder).toHaveProperty('_id');

    const res2 = await request(app)
      .put(`/api/folders/${res.body.data.folder._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: id,
      });
    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res2.body).toHaveProperty('message');
    expect(res2.body.message).toEqual(`Product with id ${id} doesn't exist`);
  });

  it('Should return NotFoundError on deleteFolder', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/folders/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual(`Folder with id ${id} doesn't exist`);
  });

  it('Should return NotFoundError on setFavouriteFolder', async () => {
    const id = mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/users/favourites/folder`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        folderId: id,
      });

    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual(`Folder with id ${id} doesn't exist`);
  });

  it('Should add and delete product from folder', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'new folder',
        products: [product._id],
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res.body.data).toHaveProperty('folder');
    expect(res.body.data.folder).toHaveProperty('_id');

    const res2 = await request(app)
      .put(`/api/folders/${res.body.data.folder._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: product2._id,
      });
    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK_POST);
    expect(res2.body.data).toHaveProperty('folder');
    expect(res2.body.data.folder).toHaveProperty('_id');
    expect(res2.body.data.folder).toHaveProperty('products');
    expect(res2.body.data.folder.products).toHaveLength(2);

    const res3 = await request(app)
      .patch(`/api/folders/${res.body.data.folder._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: product2._id,
      });
    expect(res3.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res3.body.data).toHaveProperty('folder');
    expect(res3.body.data.folder).toHaveProperty('_id');
    expect(res3.body.data.folder).toHaveProperty('products');
    expect(res3.body.data.folder.products).toHaveLength(1);
  });

  it('Should throw NotFoundError on deleteProductFromFolder', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/folders/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: id,
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual(`Product with id ${id} doesn't exist`);
  });

  it('Should throw NotFoundError on addProductToFolder', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/folders/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: id,
      });
    expect(res.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual(`Folder with id ${id} doesn't exist`);
  });
});
