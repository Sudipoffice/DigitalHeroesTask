import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/index';
import User from '../src/models/User';
import Lead from '../src/models/Lead';
import config from '../src/config';

let mongoServer: MongoMemoryServer;
let adminToken: string;
let memberToken: string;
let adminId: string;
let memberId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: '$2a$10$dummy', role: 'admin' });
  const member = await User.create({ name: 'Member', email: 'member@test.com', password: '$2a$10$dummy', role: 'member' });
  adminId = admin._id.toString();
  memberId = member._id.toString();

  const jwt = require('jsonwebtoken');
  adminToken = jwt.sign({ userId: adminId }, config.jwtSecret);
  memberToken = jwt.sign({ userId: memberId }, config.jwtSecret);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth Rules', () => {
  it('should reject unauthenticated requests to /api/leads', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  it('should reject member from deleting a lead', async () => {
    const lead = await Lead.create({ firstName: 'Test', lastName: 'User', email: 'test@test.com' });
    const res = await request(app).delete(`/api/leads/${lead._id}`).set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('should allow admin to delete a lead', async () => {
    const lead = await Lead.create({ firstName: 'Test', lastName: 'User', email: 'test2@test.com' });
    const res = await request(app).delete(`/api/leads/${lead._id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Lead Lifecycle', () => {
  it('should allow public lead capture', async () => {
    const res = await request(app).post('/api/leads/public').send({
      firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '1234567890', company: 'ACME'
    });
    expect(res.status).toBe(201);
    expect(res.body.lead.source).toBe('public');
  });

  it('should create lead, update status, assign, add note, and verify activity trail', async () => {
    const createRes = await request(app).post('/api/leads').set('Authorization', `Bearer ${adminToken}`).send({
      firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com'
    });
    expect(createRes.status).toBe(201);
    const leadId = createRes.body.lead._id;

    const updateRes = await request(app).patch(`/api/leads/${leadId}`).set('Authorization', `Bearer ${adminToken}`).send({
      status: 'contacted', assignedTo: memberId
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.lead.status).toBe('contacted');
    expect(updateRes.body.lead.assignedTo._id).toBe(memberId);

    const noteRes = await request(app).post(`/api/leads/${leadId}/notes`).set('Authorization', `Bearer ${adminToken}`).send({
      text: 'Initial contact made'
    });
    expect(noteRes.status).toBe(201);
    expect(noteRes.body.lead.notes.length).toBe(1);
    expect(noteRes.body.lead.activity.length).toBe(4);

    const getRes = await request(app).get(`/api/leads/${leadId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.lead.activity.length).toBe(4);
    expect(getRes.body.lead.notes.length).toBe(1);
  });

  it('should paginate and filter leads', async () => {
    const res = await request(app).get('/api/leads?page=1&limit=10').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
  });
});