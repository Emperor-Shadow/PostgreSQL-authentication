const request = require('supertest');
const app = require('../main'); // Adjust the path according to your project structure

describe('Authentication Endpoints', () => {
  it('should register user successfully with default organisation', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '1234567890'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toEqual('success');
    expect(res.body.message).toEqual('Registration successful');
    expect(res.body.data.user.firstName).toEqual('John');
    expect(res.body.data.user.email).toEqual('john.doe@example.com');
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should fail if required fields are missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: ''
      });

    expect(res.statusCode).toEqual(422);
    expect(res.body.errors).toBeDefined();
  });

  it('should fail if there is a duplicate email', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '0987654321'
      });

    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '0987654321'
      });

    expect(res.statusCode).toEqual(422);
    expect(res.body.errors).toBeDefined();
  });

  it('should log the user in successfully', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.message).toEqual('Login successful');
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
  });
});
