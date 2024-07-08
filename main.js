const express = require('express');
const dotenv = require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();
const SECRET =  process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;

app.use(express.json());


// Register Endpoint
app.post('/auth/register', async (req, res) => {
    const { firstName, lastName, email, password, phone } = req.body;
  
    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(422).json({ errors: [
        !firstName && { field: "firstName", message: "First name is required" },
        !lastName && { field: "lastName", message: "Last name is required" },
        !email && { field: "email", message: "Email is required" },
        !password && { field: "password", message: "Password is required" },
      ].filter(Boolean), });
    }
  
    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(422).json({ errors: [{ field: 'email', message: 'Email already exists' }] });
    }
  
    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Create User and Organisation
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        organisations: {
          create: {
            name: `${firstName}'s Organisation`,
          }
        }
      },
      include: {
        organisations: true
      }
    });
  
    // Generate Token
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1h' });
  
    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        accessToken: token,
        user: {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        }
      }
    });
  });



  const verifyToken = (req, res, next) => {

    const token = req.headers['authorization']?.split(" ")[1];
    if (!token) {
      return res.status(403).json({ status: 'Forbidden', message: 'No token provided' });
    }
  
    // token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET, (err, decoded) => { 
      if (err) {
        return res.status(500).json({ status: 'Failed', message: 'Failed to authenticate token' });
      }
  
      req.userId = decoded.userId;
      next();
    });
  };





  // Login Endpoint
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Find User
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ status: 'Bad request', message: 'Authentication failed' });
  }

  // Check Password
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ status: 'Bad request', message: 'Authentication failed' });
  }

  // Generate Token
  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1h' });

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      accessToken: token,
      user: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      }
    }
  });
});


// Get User
app.get('/api/users/:id', verifyToken, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { organisations: true }
  });

  if (!user) {
    return res.status(404).json({ status: 'Not Found', message: 'User not found' });
  }

  res.status(200).json({
    status: 'success',
    message: '',
    data: {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone
    }
  });
});

// Get Organisations
app.get('/api/organisations', verifyToken, async (req, res) => {
  const organisations = await prisma.organisation.findMany({
    where: { users: { some: { id: req.userId } } },
  });

  res.status(200).json({
    status: 'success',
    message: '',
    data: { organisations }
  });
});

// Get Organisation by ID
app.get('/api/organisations/:orgId', verifyToken, async (req, res) => {
  const org = await prisma.organisation.findUnique({
    where: { id: req.params.orgId },
    include: { users: true }
  });

  if (!org) {
    return res.status(404).json({ status: 'Not Found', message: 'Organisation not found' });
  }

  if (!org.users.some(user => user.id === req.userId)) {
    return res.status(403).json({ status: 'Forbidden', message: 'Access denied' });
  }

  res.status(200).json({
    status: 'success',
    message: '',
    data: {
      orgId: org.id,
      name: org.name,
      description: org.description
    }
  });
});

// Create Organisation
app.post('/api/organisations', verifyToken, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(422).json({ errors: [{ field: 'name', message: 'Name is required' }] });
  }

  const org = await prisma.organisation.create({
    data: {
      name,
      description,
      users: { connect: { id: req.userId } }
    }
  });

  res.status(201).json({
    status: 'success',
    message: 'Organisation created successfully',
    data: {
      orgId: org.id,
      name: org.name,
      description: org.description
    }
  });
});

// Add User to Organisation
app.post('/api/organisations/:orgId/users', verifyToken, async (req, res) => {
  const { userId } = req.body;

  if (!userId) { 
    return res.status(422).json({ errors: [{ field: 'userId', message: 'userId is required' }] });
   }
 const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organisations: true }
  });

  const org = await prisma.organisation.findUnique({
    where: { id: req.params.orgId },
    include: { users: true }
  });

  if ( !user ) {
    return res.status(422).json({ errors: [{ status: 'Not Found', message: 'Invalid userId' }] });
  }

  if (!org) {
    return res.status(404).json({ status: 'Not Found', message: 'Organisation not found' });
  }

  if (!org.users.some(user => user.id === req.userId)) {
    return res.status(403).json({ status: 'Forbidden', message: 'Access denied' });
  }

  await prisma.organisation.update({
    where: { id: req.params.orgId },
    data: { users: { connect: { id: userId } } }
  });

  res.status(200).json({
    status: 'success',
    message: 'User added to organisation successfully'
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;