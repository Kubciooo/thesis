/* eslint-disable no-undef */
const request = require('supertest');
const mongoose = require('mongoose');
const dbHandler = require('./db');
const app = require('../app');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const Product = require('../models/product.model');
const HTTP_STATUS_MESSAGES = require('../constants/httpStatusMessages');

describe('/product route', () => {
  jest.setTimeout(60000);

  let userToken;
  let categoryId;
  let shopId;
  const shops = [];

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
        name: 'mediaexpert',
        mainUrl: 'https://mediaexpert.pl',
      });
    shopId = shopResponse.body.data.shop._id;
    shops.push(shopId);

    const shopResponse2 = await request(app)
      .post('/api/shops')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        name: 'mediamarkt',
        mainUrl: 'https://mediamarkt.pl/',
      });
    shops.push(shopResponse2.body.data.shop._id);

    const shopResponse3 = await request(app)
      .post('/api/shops')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        name: 'xkom',
        mainUrl: 'https://www.x-kom.pl/',
      });
    shops.push(shopResponse3.body.data.shop._id);

    const shopResponse4 = await request(app)
      .post('/api/shops')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        name: 'rtveuroagd',
        mainUrl: 'https://www.euro.com.pl/',
      });
    shops.push(shopResponse4.body.data.shop._id);

    const shopResponse5 = await request(app)
      .post('/api/shops')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        name: 'morele',
        mainUrl: 'https://morele.net/',
      });
    shops.push(shopResponse5.body.data.shop._id);

    const blockedShopsResponse = await request(app)
      .post('/api/users/blockedShops')
      .set('Authorization', `Bearer ${user.body.data.token}`)
      .send({
        shopId: shopResponse5.body.data.shop._id,
        blocked: true,
      });
    user.blockedShops = blockedShopsResponse.body.data.blockedShops;
  });

  beforeEach(async () => {
    const user = await request(app).post('/api/users/login').send({
      login: 'kubcio',
      password: 'kubcio',
    });
    userToken = user.body.data.token;
  });

  afterEach(async () => await dbHandler.clearCollection('products'));
  afterAll(async () => await dbHandler.closeDatabase());

  it('should create a new product item', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        url: 'https://www.mediaexpert.pl/agd-male/do-kuchni/kuchnie-mikrofalowe/kuchenka-mikrofalowa-samsung-ge83x',
        name: 'Kuchenka mikrofalowa SAMSUNG GE83X',
        price: 429,
        categories: [categoryId],
        shop: shopId,
        coupons: ['testing-coupon'],
        otherPromotions: [
          {
                      name: '   Multirabaty! Pi??ty wybrany produkt za 1 z??! ',
          },
          {
            url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
          },
        ],
      });

    expect(response.status).toBe(HTTP_STATUS_CODES.OK_POST);
    expect(response.body.data.product.name).toBe(
      'Kuchenka mikrofalowa SAMSUNG GE83X'
    );

    expect(response.body.data).toHaveProperty('product');
    const responseProduct = response.body.data.product;
    expect(responseProduct).toHaveProperty('price');
    expect(responseProduct).toHaveProperty('coupons');
    expect(responseProduct).toHaveProperty('otherPromotions');


    expect(responseProduct.price).toBe(429);
    expect(responseProduct.coupons).toEqual(['testing-coupon']);
    expect(responseProduct.otherPromotions).toHaveLength(2);
    expect(responseProduct.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );
    const product = await Product.findById(responseProduct._id);

    expect(product.name).toBe('Kuchenka mikrofalowa SAMSUNG GE83X');
    expect(product.price).toBe(429);
    expect(product.coupons).toEqual(['testing-coupon']);
    expect(product.otherPromotions).toHaveLength(2);
    expect(product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );
  });

  it('should find a product item', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        url: 'https://www.mediaexpert.pl/agd-male/do-kuchni/kuchnie-mikrofalowe/kuchenka-mikrofalowa-samsung-ge83x',
        name: 'Kuchenka mikrofalowa SAMSUNG GE83X',
        price: 429,
        categories: [categoryId],
        shop: shopId,
        coupons: ['testing-coupon'],
        otherPromotions: [
          {
            name: '         Multirabaty! Pi??ty wybrany produkt za 1 z??!            ',
          },
          {
            url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
          },
        ],
      });

    expect(response.status).toBe(HTTP_STATUS_CODES.OK_POST);
    expect(response.body.data.product.name).toBe(
      'Kuchenka mikrofalowa SAMSUNG GE83X'
    );
    expect(response.body.data.product.price).toBe(429);
    expect(response.body.data.product.coupons).toEqual(['testing-coupon']);
    expect(response.body.data.product.otherPromotions).toHaveLength(2);
    expect(response.body.data.product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );
    const productResponse = await request(app)
      .get(`/api/products/${response.body.data.product._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(productResponse.body).toHaveProperty('data');
    expect(productResponse.body.data).toHaveProperty('product');
    expect(productResponse.body.data.product).toHaveProperty('name');
    expect(productResponse.body.data.product).toHaveProperty('price');
    expect(productResponse.body.data.product).toHaveProperty('coupons');
    expect(productResponse.body.data.product).toHaveProperty('otherPromotions');
    expect(productResponse.body.data.product.name).toBe(
      'Kuchenka mikrofalowa SAMSUNG GE83X'
    );
    expect(productResponse.body.data.product.price).toBe(429);
    expect(productResponse.body.data.product.coupons).toEqual([
      'testing-coupon',
    ]);
    expect(productResponse.body.data.product.otherPromotions).toHaveLength(2);
    expect(productResponse.body.data.product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );
  });

  it('should find 2 products', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send([
        {
          url: 'https://www.mediaexpert.pl/agd-male/do-kuchni/kuchnie-mikrofalowe/kuchenka-mikrofalowa-samsung-ge83x',
          name: 'Kuchenka mikrofalowa SAMSUNG GE83X',
          price: 429,
          categories: [categoryId],
          shop: shopId,
          coupons: ['testing-coupon'],
          otherPromotions: [
            {
              name: '         Multirabaty! Pi??ty wybrany produkt za 1 z??!            ',
            },
            {
              url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
            },
          ],
        },
        {
          url: 'https://www.mediaexpert.pl/komputery-i-tablety/laptopy-i-ultrabooki/laptopy/notebook-asus-zbook-13-ux325ja-kg249t-i5-1035g4-16gb-512ssd-irisxe-13-3-w10-pink',
          name: 'Laptop ASUS ZenBook 13.3" OLED i5-1035G4 16GB SSD 512GB Windows 10 Home',
          price: 4499,
          categories: [categoryId],
          shop: shopId,
          coupons: ['MLO-061121'],
          otherPromotions: [
            {
              name: '         Multirabaty! Pi??ty wybrany produkt za 1 z??!            ',
            },
            {
              url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
            },
            {
              name: 'P???? roku nie p??acisz! Pierwsza rata w maju 2022              ',
            },
          ],
        },
      ]);

    expect(response.status).toBe(HTTP_STATUS_CODES.OK_POST);

    const allProductsResponse = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(allProductsResponse.body).toHaveProperty('data');
    expect(allProductsResponse.body.data).toHaveProperty('products');
    expect(allProductsResponse.body.data.products).toHaveLength(2);
    expect(allProductsResponse.body.data.products[0].name).toBe(
      'Kuchenka mikrofalowa SAMSUNG GE83X'
    );
    expect(allProductsResponse.body.data.products[0].price).toBe(429);
    expect(allProductsResponse.body.data.products[0].coupons).toEqual([
      'testing-coupon',
    ]);
    expect(
      allProductsResponse.body.data.products[0].otherPromotions
    ).toHaveLength(2);
    expect(
      allProductsResponse.body.data.products[0].otherPromotions[0].name
    ).toBe('Multirabaty! Pi??ty wybrany produkt za 1 z??!');
    expect(allProductsResponse.body.data.products[1].name).toBe(
      'Laptop ASUS ZenBook 13.3" OLED i5-1035G4 16GB SSD 512GB Windows 10 Home'
    );
    expect(allProductsResponse.body.data.products[1].price).toBe(4499);
    expect(allProductsResponse.body.data.products[1].coupons).toEqual([
      'MLO-061121',
    ]);
    expect(
      allProductsResponse.body.data.products[1].otherPromotions
    ).toHaveLength(3);
    expect(
      allProductsResponse.body.data.products[1].otherPromotions[0].name
    ).toBe('Multirabaty! Pi??ty wybrany produkt za 1 z??!');
    expect(
      allProductsResponse.body.data.products[1].otherPromotions[2].name
    ).toBe('P???? roku nie p??acisz! Pierwsza rata w maju 2022');
  });

  it('should create 2 products and find 1', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send([
        {
          url: 'https://www.mediaexpert.pl/agd-male/do-kuchni/kuchnie-mikrofalowe/kuchenka-mikrofalowa-samsung-ge83x',
          name: 'Kuchenka mikrofalowa SAMSUNG GE83X',
          price: 429,
          categories: [categoryId],
          shop: shopId,
          coupons: ['testing-coupon'],
          otherPromotions: [
            {
              name: '         Multirabaty! Pi??ty wybrany produkt za 1 z??!            ',
            },
            {
              url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
            },
          ],
        },
        {
          url: 'https://www.mediaexpert.pl/komputery-i-tablety/laptopy-i-ultrabooki/laptopy/notebook-asus-zbook-13-ux325ja-kg249t-i5-1035g4-16gb-512ssd-irisxe-13-3-w10-pink',
          name: 'Laptop ASUS ZenBook 13.3" OLED i5-1035G4 16GB SSD 512GB Windows 10 Home',
          price: 4499,
          categories: [categoryId],
          shop: shopId,
          coupons: ['MLO-061121'],
          otherPromotions: [
            {
              name: '         Multirabaty! Pi??ty wybrany produkt za 1 z??!            ',
            },
            {
              url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
            },
            {
              name: 'P???? roku nie p??acisz! Pierwsza rata w maju 2022              ',
            },
          ],
        },
      ]);

    expect(response.status).toBe(HTTP_STATUS_CODES.OK_POST);

    const allProductsResponse = await request(app)
      .get('/api/products?name=laptop')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(allProductsResponse.body).toHaveProperty('data');
    expect(allProductsResponse.body.data).toHaveProperty('products');
    expect(allProductsResponse.body.data.products).toHaveLength(1);
  });

  it('Should run scrapper for all shops', async () => {
    const response = await request(app)
      .post('/api/products/scrapper')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        minPrice: 3000,
        maxPrice: 6000,
        productName: 'iphone 12 pro',
        categoryId,
        shops,
      });

    expect(response.status).toBe(HTTP_STATUS_CODES.OK);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('products');
    expect(response.body.data.products).not.toHaveLength(0);

    const res = await request(app)
      .get('/api/products?price[gte]=3000&price[lte]=6000')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'iphone 12 pro',
      });

    expect(res.status).toBe(HTTP_STATUS_CODES.OK);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('products');
    expect(res.body.data.products).not.toHaveLength(0);
  });

  it('Should throw ValidationError', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        url: 'Wrong url!',
        name: 'Kuchenka mikrofalowa SAMSUNG GE83X',
        price: 429,
        categories: [categoryId],
        shop: shopId,
        coupons: ['testing-coupon'],
        otherPromotions: [
          {
            name: '         Multirabaty! Pi??ty wybrany produkt za 1 z??!            ',
          },
          {
            url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
          },
        ],
      });

    expect(response.status).toBe(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe(HTTP_STATUS_MESSAGES.ERROR);
    expect(response.body).toHaveProperty('name');
    expect(response.body.name).toBe('Validation Error');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe(
      'Invalid input data. Validator failed for path `url` with value `Wrong url!`'
    );
  });

  it('should throw NotFoundError', async () => {
    const id = mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/products/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe(HTTP_STATUS_MESSAGES.ERROR);
    expect(response.body).toHaveProperty('name');
    expect(response.body.name).toBe('NotFoundError');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe(`Product with id ${id} doesn't exist`);
  });

  it('Should throw HTTPValidationError', async () => {
    const response = await request(app)
      .post('/api/products/scrapper')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productName: 'iphone 12 pro',
        categoryId,
        shops,
      });

    expect(response.status).toBe(HTTP_STATUS_CODES.INVALID);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe(HTTP_STATUS_MESSAGES.ERROR);
    expect(response.body).toHaveProperty('name');
    expect(response.body.name).toBe('HTTPValidationError');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe(
      '{minPrice, maxPrice} fields are required.'
    );
  });

  it('Should throw NotFoundError', async () => {
    const response = await request(app)
      .post('/api/products/scrapper')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productName: 'iphone 12 pro',
        minPrice: 3000,
        maxPrice: 6000,
        categoryId: mongoose.Types.ObjectId(),
        shops,
      });

    expect(response.status).toBe(HTTP_STATUS_CODES.NOT_FOUND);
  });

  it('should follow a new product item', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        url: 'https://www.mediaexpert.pl/agd-male/do-kuchni/kuchnie-mikrofalowe/kuchenka-mikrofalowa-samsung-ge83x',
        name: 'Kuchenka mikrofalowa SAMSUNG GE83X',
        price: 429,
        categories: [categoryId],
        shop: shopId,
        coupons: ['testing-coupon'],
        otherPromotions: [
          {
            name: '         Multirabaty! Pi??ty wybrany produkt za 1 z??!            ',
          },
          {
            url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
          },
        ],
      });

    expect(response.status).toBe(HTTP_STATUS_CODES.OK_POST);
    expect(response.body.data.product.name).toBe(
      'Kuchenka mikrofalowa SAMSUNG GE83X'
    );
    expect(response.body.data.product.price).toBe(429);
    expect(response.body.data.product.coupons).toEqual(['testing-coupon']);
    expect(response.body.data.product.otherPromotions).toHaveLength(2);
    expect(response.body.data.product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );
    const product = await Product.findById(response.body.data.product._id);

    expect(product.name).toBe('Kuchenka mikrofalowa SAMSUNG GE83X');
    expect(product.price).toBe(429);
    expect(product.coupons).toEqual(['testing-coupon']);
    expect(product.otherPromotions).toHaveLength(2);
    expect(product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );

    const res2 = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK);
  });

  it('should set a product as favourite and get it', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        url: 'https://www.mediaexpert.pl/agd-male/do-kuchni/kuchnie-mikrofalowe/kuchenka-mikrofalowa-samsung-ge83x',
        name: 'Kuchenka mikrofalowa SAMSUNG GE83X',
        price: 429,
        categories: [categoryId],
        shop: shopId,
        coupons: ['testing-coupon'],
        otherPromotions: [
          {
            name: '         Multirabaty! Pi??ty wybrany produkt za 1 z??!            ',
          },
          {
            url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
          },
        ],
      });

    expect(response.status).toBe(HTTP_STATUS_CODES.OK_POST);
    expect(response.body.data.product.name).toBe(
      'Kuchenka mikrofalowa SAMSUNG GE83X'
    );
    expect(response.body.data.product.price).toBe(429);
    expect(response.body.data.product.coupons).toEqual(['testing-coupon']);
    expect(response.body.data.product.otherPromotions).toHaveLength(2);
    expect(response.body.data.product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );
    const product = await Product.findById(response.body.data.product._id);

    expect(product.name).toBe('Kuchenka mikrofalowa SAMSUNG GE83X');
    expect(product.price).toBe(429);
    expect(product.coupons).toEqual(['testing-coupon']);
    expect(product.otherPromotions).toHaveLength(2);
    expect(product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );

    const res2 = await request(app)
      .post(`/api/users/favourites/product`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: product._id,
      });

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK);

    const res3 = await request(app)
      .get(`/api/users/favourites/product`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res3.statusCode).toEqual(HTTP_STATUS_CODES.OK);
  });

  it('Should return NotFoundError on follow product', async () => {
    const randomToken = mongoose.Types.ObjectId();

    const res2 = await request(app)
      .patch(`/api/products/${randomToken}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
  });

  it('Should return NotFoundError on set a product as favourite', async () => {
    const randomToken = mongoose.Types.ObjectId();

    const res2 = await request(app)
      .post(`/api/users/favourites/product`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: randomToken,
      });

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
  });

  it('should unfollow a product item', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        url: 'https://www.mediaexpert.pl/agd-male/do-kuchni/kuchnie-mikrofalowe/kuchenka-mikrofalowa-samsung-ge83x',
        name: 'Kuchenka mikrofalowa SAMSUNG GE83X',
        price: 429,
        categories: [categoryId],
        shop: shopId,
        coupons: ['testing-coupon'],
        otherPromotions: [
          {
            name: '         Multirabaty! Pi??ty wybrany produkt za 1 z??!            ',
          },
          {
            url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
          },
        ],
      });

    expect(response.status).toBe(HTTP_STATUS_CODES.OK_POST);
    expect(response.body.data.product.name).toBe(
      'Kuchenka mikrofalowa SAMSUNG GE83X'
    );
    expect(response.body.data.product.price).toBe(429);
    expect(response.body.data.product.coupons).toEqual(['testing-coupon']);
    expect(response.body.data.product.otherPromotions).toHaveLength(2);
    expect(response.body.data.product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );
    const product = await Product.findById(response.body.data.product._id);

    expect(product.name).toBe('Kuchenka mikrofalowa SAMSUNG GE83X');
    expect(product.price).toBe(429);
    expect(product.coupons).toEqual(['testing-coupon']);
    expect(product.otherPromotions).toHaveLength(2);
    expect(product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );

    const res2 = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK);

    const res3 = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res3.statusCode).toEqual(HTTP_STATUS_CODES.OK);
  });

  it('Should return NotFoundError on ufollow product', async () => {
    const randomToken = mongoose.Types.ObjectId();

    const res2 = await request(app)
      .delete(`/api/products/${randomToken}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.NOT_FOUND);
  });

  it('Should get all followed products', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        url: 'https://www.mediaexpert.pl/agd-male/do-kuchni/kuchnie-mikrofalowe/kuchenka-mikrofalowa-samsung-ge83x',
        name: 'Kuchenka mikrofalowa SAMSUNG GE83X',
        price: 429,
        categories: [categoryId],
        shop: shopId,
        coupons: ['testing-coupon'],
        otherPromotions: [
          {
            name: '         Multirabaty! Pi??ty wybrany produkt za 1 z??!            ',
          },
          {
            url: 'https://www.mediaexpert.pl/lp,piaty-produkt-1zl?clickId=112918',
          },
        ],
      });

    expect(response.status).toBe(HTTP_STATUS_CODES.OK_POST);
    expect(response.body.data.product.name).toBe(
      'Kuchenka mikrofalowa SAMSUNG GE83X'
    );
    expect(response.body.data.product.price).toBe(429);
    expect(response.body.data.product.coupons).toEqual(['testing-coupon']);
    expect(response.body.data.product.otherPromotions).toHaveLength(2);
    expect(response.body.data.product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );
    const product = await Product.findById(response.body.data.product._id);

    expect(product.name).toBe('Kuchenka mikrofalowa SAMSUNG GE83X');
    expect(product.price).toBe(429);
    expect(product.coupons).toEqual(['testing-coupon']);
    expect(product.otherPromotions).toHaveLength(2);
    expect(product.otherPromotions[0].name).toBe(
      'Multirabaty! Pi??ty wybrany produkt za 1 z??!'
    );

    const res2 = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res2.statusCode).toEqual(HTTP_STATUS_CODES.OK);

    const res3 = await request(app)
      .get('/api/users/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res3.statusCode).toEqual(HTTP_STATUS_CODES.OK);
    expect(res3.body.data.products).toHaveLength(1);
  });
});
