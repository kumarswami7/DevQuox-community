import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Project } from '../../src/models/Project.js';
import { ProjectMember } from '../../src/models/ProjectMember.js';
import { Contract } from '../../src/models/Contract.js';
import { FinancialMilestone } from '../../src/models/FinancialMilestone.js';
import { Payment } from '../../src/models/Payment.js';
import { WebhookEvent } from '../../src/models/WebhookEvent.js';
import { Dispute } from '../../src/models/Dispute.js';
import { Notification } from '../../src/models/Notification.js';

dotenv.config();

describe('DevConnect Phase 7: Payments, Contracts & Financial Milestones Integration Tests', { concurrency: 1 }, () => {
  let server;
  let baseUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  // Users
  let clientUser;
  let clientToken;
  let developerUser;
  let developerToken;
  let outsiderUser;
  let outsiderToken;

  // Track created resources for cleanup
  const createdProjectIds = [];
  const createdContractIds = [];
  let testProject;

  const createJwtToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'super_secret_jwt_key_908124_mern', {
      expiresIn: '7d',
    });
  };

  before(async () => {
    process.env.NODE_ENV = 'test';
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devconnect-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    const app = createApp();
    server = http.createServer(app);

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Create test accounts
    clientUser = await User.create({
      name: `Fin Client ${uniqueSuffix}`,
      username: `fin_client_${uniqueSuffix}`,
      email: `fin_client_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'client',
      status: 'active',
    });
    clientToken = createJwtToken(clientUser._id);

    developerUser = await User.create({
      name: `Fin Dev ${uniqueSuffix}`,
      username: `fin_dev_${uniqueSuffix}`,
      email: `fin_dev_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    developerToken = createJwtToken(developerUser._id);

    outsiderUser = await User.create({
      name: `Fin Outsider ${uniqueSuffix}`,
      username: `fin_outsider_${uniqueSuffix}`,
      email: `fin_outsider_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    outsiderToken = createJwtToken(outsiderUser._id);

    // Create primary project owned by clientUser
    testProject = await Project.create({
      title: `Fin Collaboration Platform ${uniqueSuffix}`,
      description: 'End-to-end milestone and financial agreement test project.',
      category: 'Web Development',
      projectType: 'freelance',
      experienceLevel: 'intermediate',
      teamSize: 3,
      budget: 5000,
      duration: '3 months',
      status: 'in_progress',
      visibility: 'public',
      requiredSkills: ['Node.js', 'React', 'MongoDB'],
      owner: clientUser._id,
    });
    createdProjectIds.push(testProject._id);

    // Add developerUser as accepted member
    await ProjectMember.create({
      project: testProject._id,
      user: developerUser._id,
      role: 'member',
      status: 'active',
    });
  });

  after(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        if (createdProjectIds.length > 0) {
          await Contract.deleteMany({ projectId: { $in: createdProjectIds } });
          await FinancialMilestone.deleteMany({ projectId: { $in: createdProjectIds } });
          await Payment.deleteMany({ projectId: { $in: createdProjectIds } });
          await Dispute.deleteMany({ projectId: { $in: createdProjectIds } });
          await WebhookEvent.deleteMany({});
          await ProjectMember.deleteMany({ project: { $in: createdProjectIds } });
          await Project.deleteMany({ _id: { $in: createdProjectIds } });
        }
        await User.deleteMany({
          _id: { $in: [clientUser._id, developerUser._id, outsiderUser._id] },
        });
        await Notification.deleteMany({
          recipient: { $in: [clientUser._id, developerUser._id, outsiderUser._id] },
        });
      }
    } catch {
      // quiet cleanup
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // State shared between tests
  let createdContract;
  let milestone1;
  let milestone2;
  let activePayment;

  // =========================================================================
  // 1. CONTRACT LIFECYCLE & ACCESS CONTROL
  // =========================================================================
  describe('1. Contract Creation, Access Control & Agreement Review', { concurrency: 1 }, () => {
    test('POST /api/v1/contracts allows project owner to create draft agreement with initial milestones', async () => {
      const res = await fetch(`${baseUrl}/api/v1/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
          projectId: testProject._id,
          developerId: developerUser._id,
          title: 'Full-Stack Phase 7 Agreement',
          scope: 'Implement financial milestones and contracts with secure webhooks.',
          deliverables: ['Database schemas', 'Stripe mock provider', 'Raw-body webhook listener'],
          amount: 2500, // $2500
          currency: 'USD',
          paymentTerms: 'milestone_based',
          milestones: [
            {
              title: 'Milestone 1: Backend Architecture',
              description: 'Implement contracts, milestones, and checkout endpoints.',
              deliverables: ['Models', 'Routes'],
              amount: 1500,
            },
            {
              title: 'Milestone 2: Frontend & Tests',
              description: 'Implement UI components and automated integration tests.',
              deliverables: ['React UI', 'Integration tests'],
              amount: 1000,
            },
          ],
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.ok(body.contract?._id);
      assert.strictEqual(body.contract.status, 'draft');
      assert.strictEqual(body.contract.totalAmountMinorUnits, 250000);
      assert.strictEqual(body.milestones?.length, 2);

      createdContract = body.contract;
      createdContractIds.push(createdContract._id);
      milestone1 = body.milestones[0];
      milestone2 = body.milestones[1];
    });

    test('POST /api/v1/contracts rejects outsider with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${outsiderToken}`,
        },
        body: JSON.stringify({
          projectId: testProject._id,
          developerId: developerUser._id,
          title: 'Unauthorized Contract',
          scope: 'Hacker scope',
          deliverables: ['Exploit'],
          amount: 1000,
        }),
      });

      assert.strictEqual(res.status, 403);
    });

    test('GET /api/v1/contracts/:id allows client and developer to view contract details', async () => {
      // Client view
      const clientRes = await fetch(`${baseUrl}/api/v1/contracts/${createdContract._id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert.strictEqual(clientRes.status, 200);

      // Developer view
      const devRes = await fetch(`${baseUrl}/api/v1/contracts/${createdContract._id}`, {
        headers: { Authorization: `Bearer ${developerToken}` },
      });
      assert.strictEqual(devRes.status, 200);
    });

    test('GET /api/v1/contracts/:id rejects outsider with 403 Access Denied', async () => {
      const res = await fetch(`${baseUrl}/api/v1/contracts/${createdContract._id}`, {
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });
      assert.strictEqual(res.status, 403);
    });
  });

  // =========================================================================
  // 2. FORMAL AGREEMENT ACCEPTANCE & AMENDMENT VERSIONING
  // =========================================================================
  describe('2. Agreement Acceptance & Versioning', { concurrency: 1 }, () => {
    test('POST /api/v1/contracts/:id/send moves status to pending_acceptance', async () => {
      const res = await fetch(`${baseUrl}/api/v1/contracts/${createdContract._id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.contract.status, 'pending_acceptance');
    });

    test('POST /api/v1/contracts/:id/accept rejects client attempting to accept on behalf of developer', async () => {
      const res = await fetch(`${baseUrl}/api/v1/contracts/${createdContract._id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      assert.strictEqual(res.status, 403);
    });

    test('POST /api/v1/contracts/:id/accept allows assigned developer to accept agreement', async () => {
      const res = await fetch(`${baseUrl}/api/v1/contracts/${createdContract._id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${developerToken}` },
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.contract.status, 'active');
      assert.ok(body.contract.acceptanceRecords.length >= 2); // Client and Developer records
    });

    test('Contract Amendment: modifying active contract archives version 1 and transitions to pending_acceptance', async () => {
      const res = await fetch(`${baseUrl}/api/v1/contracts/${createdContract._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
          title: 'Full-Stack Phase 7 Agreement (Amended)',
          scope: 'Expanded scope including advanced dispute arbitration.',
          amount: 2800, // Budget amendment
          deliverables: ['Database schemas', 'Stripe mock provider', 'Raw-body webhook listener', 'Dispute arbitration'],
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.contract.version, 2);
      assert.strictEqual(body.contract.status, 'pending_acceptance');
      assert.strictEqual(body.contract.versionHistory.length, 1);
      assert.strictEqual(body.contract.versionHistory[0].version, 1);

      // Developer re-accepts amendment v2
      const acceptRes = await fetch(`${baseUrl}/api/v1/contracts/${createdContract._id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${developerToken}` },
      });
      assert.strictEqual(acceptRes.status, 200);
    });
  });

  // =========================================================================
  // 3. FINANCIAL MILESTONES: SEPARATION OF WORK AND PAYMENT STATUS
  // =========================================================================
  describe('3. Work Status vs Payment Status & Direct Tampering Prevention', { concurrency: 1 }, () => {
    test('Initial milestone has separate workStatus (pending) and paymentStatus (not_funded)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/financial-milestones/contract/${createdContract._id}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.milestones[0].workStatus, 'pending');
      assert.strictEqual(body.milestones[0].paymentStatus, 'not_funded');
    });

    test('Security: user cannot mark paymentStatus as paid via regular PATCH request (403/400)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/financial-milestones/${milestone1._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${developerToken}`,
        },
        body: JSON.stringify({
          paymentStatus: 'paid',
        }),
      });

      assert.ok(res.status === 400 || res.status === 403);
    });

    test('Developer submits milestone work for review', async () => {
      const res = await fetch(`${baseUrl}/api/v1/financial-milestones/${milestone1._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${developerToken}`,
        },
        body: JSON.stringify({
          notes: 'Completed backend schemas, provider abstraction, and webhook listener.',
          links: ['https://github.com/community/pull/101'],
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.milestone.workStatus, 'submitted');
      assert.strictEqual(body.milestone.paymentStatus, 'not_funded');
    });

    test('Client requests revision on milestone deliverable', async () => {
      const res = await fetch(`${baseUrl}/api/v1/financial-milestones/${milestone1._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
          decision: 'revision_requested',
          feedback: 'Please include HMAC signature validation in the mock test suite.',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.milestone.workStatus, 'revision_requested');
    });

    test('Developer resubmits and client formally approves milestone deliverable', async () => {
      // 1. Resubmit
      await fetch(`${baseUrl}/api/v1/financial-milestones/${milestone1._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${developerToken}`,
        },
        body: JSON.stringify({
          notes: 'HMAC signature verification test included and verified.',
          links: ['https://github.com/community/pull/101'],
        }),
      });

      // 2. Client Approves
      const res = await fetch(`${baseUrl}/api/v1/financial-milestones/${milestone1._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
          decision: 'approved',
          feedback: 'Deliverables verified and accepted.',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.milestone.workStatus, 'approved');
      assert.strictEqual(body.milestone.paymentStatus, 'not_funded');
    });
  });

  // =========================================================================
  // 4. PAYMENT CHECKOUT, VERIFICATION & WEBHOOK IDEMPOTENCY
  // =========================================================================
  describe('4. Payment Order Creation, Webhook Signature Verification & Idempotency', { concurrency: 1 }, () => {
    test('POST /api/v1/payments/create-checkout-session creates pending transaction with authoritative server amount', async () => {
      const res = await fetch(`${baseUrl}/api/v1/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
          milestoneId: milestone1._id,
          // Attacker attempting to pass custom amount in client request
          amount: 1,
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.payment?._id);
      // Authoritative verification: amount was taken from database milestone (150000 minor units = $1500), NOT client's 1
      assert.strictEqual(body.payment.amountMinorUnits, 150000);
      assert.strictEqual(body.payment.status, 'pending');

      activePayment = body.payment;
    });

    test('POST /api/v1/payments/create-checkout-session rejects non-client outsider (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${outsiderToken}`,
        },
        body: JSON.stringify({
          milestoneId: milestone1._id,
        }),
      });

      assert.strictEqual(res.status, 403);
    });

    test('Webhook Verification: invalid signature is rejected with 400 Bad Request', async () => {
      const fakePayload = JSON.stringify({
        id: `evt_test_${uniqueSuffix}_1`,
        type: 'checkout.session.completed',
        data: { object: { id: activePayment.providerSessionId } },
      });

      const res = await fetch(`${baseUrl}/api/v1/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'invalid_signature_hash',
        },
        body: fakePayload,
      });

      assert.strictEqual(res.status, 400);
    });

    test('Webhook Verification: valid HMAC signed webhook marks Payment succeeded and Milestone paid', async () => {
      const webhookSecret = 'whsec_mock_devconnect_test_secret';
      const eventId = `evt_test_${uniqueSuffix}_success`;

      const payload = JSON.stringify({
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: activePayment.providerSessionId,
            payment_status: 'paid',
            metadata: {
              paymentId: activePayment._id.toString(),
              milestoneId: milestone1._id.toString(),
              contractId: createdContract._id.toString(),
              projectId: testProject._id.toString(),
            },
          },
        },
      });

      // Compute valid HMAC SHA-256 signature
      const validSignature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

      const res = await fetch(`${baseUrl}/api/v1/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': validSignature,
        },
        body: payload,
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.received, true);

      // Verify Payment record was updated in database
      const updatedPayment = await Payment.findById(activePayment._id);
      assert.strictEqual(updatedPayment.status, 'succeeded');
      assert.ok(updatedPayment.invoiceNumber);

      // Verify Milestone record was updated to paid
      const updatedMilestone = await FinancialMilestone.findById(milestone1._id);
      assert.strictEqual(updatedMilestone.paymentStatus, 'paid');
    });

    test('Webhook Idempotency: duplicate webhook event is recognized and returned safely without duplicate charges', async () => {
      const webhookSecret = 'whsec_mock_devconnect_test_secret';
      const eventId = `evt_test_${uniqueSuffix}_success`; // Same event ID as previous test

      const payload = JSON.stringify({
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: activePayment.providerSessionId,
            payment_status: 'paid',
          },
        },
      });

      const validSignature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

      const res = await fetch(`${baseUrl}/api/v1/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': validSignature,
        },
        body: payload,
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.received, true);
      assert.strictEqual(body.duplicate, true);
    });
  });

  // =========================================================================
  // 5. INVOICES, TRANSACTIONS PRIVACY & DISPUTES
  // =========================================================================
  describe('5. Ledger Invoices, Transaction History & Dispute Logging', { concurrency: 1 }, () => {
    test('GET /api/v1/payments/:id/invoice returns printable invoice and receipt details', async () => {
      const res = await fetch(`${baseUrl}/api/v1/payments/${activePayment._id}/invoice`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.invoice?.invoiceNumber);
      assert.strictEqual(body.invoice.status, 'succeeded');
      assert.strictEqual(body.invoice.amountMinorUnits, 150000);
      assert.ok(body.invoice.payer);
      assert.ok(body.invoice.recipient);
    });

    test('Privacy: outsider cannot view another user’s invoice or transactions (403)', async () => {
      // 1. Invoice access
      const invoiceRes = await fetch(`${baseUrl}/api/v1/payments/${activePayment._id}/invoice`, {
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });
      // 2. Project payments access
      const projectPaymentsRes = await fetch(`${baseUrl}/api/v1/payments/project/${testProject._id}`, {
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });
      assert.strictEqual(invoiceRes.status, 403);
      assert.strictEqual(projectPaymentsRes.status, 403);
    });

    test('POST /api/v1/payments/dispute records a dispute and freezes milestone payment', async () => {
      const res = await fetch(`${baseUrl}/api/v1/payments/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
          contractId: createdContract._id,
          milestoneId: milestone2._id,
          reason: 'deliverable_unmet',
          description: 'Testing dispute flow on milestone 2.',
          evidence: ['https://github.com/community/issues/5'],
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.dispute.status, 'opened');

      // Verify milestone status transitioned to disputed
      const checkM2 = await FinancialMilestone.findById(milestone2._id);
      assert.strictEqual(checkM2.paymentStatus, 'disputed');
    });

    test('POST /api/v1/payments/refund processes refund on eligible transaction', async () => {
      const res = await fetch(`${baseUrl}/api/v1/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
          paymentId: activePayment._id,
          reason: 'client_request',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.payment.status, 'refunded');
      assert.ok(body.payment.refundId);
    });
  });
});
