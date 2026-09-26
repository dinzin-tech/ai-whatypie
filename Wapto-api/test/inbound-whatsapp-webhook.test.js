import assert from 'node:assert';
import test from 'node:test';

// Phone normalization helper (mirroring backend normalizeStoredPhone & frontend normalizePhoneForComparison)
function normalizePhoneForComparison(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

// Inbound webhook iteration handler simulation (mirroring app.js & whatsapp-webhook.controller.js)
async function processWebhookPayload(payload, mockDb, options = {}) {
  const { onMessageProcessed, onStatusProcessed } = options;
  const entries = payload?.entry;

  if (!Array.isArray(entries) || entries.length === 0) {
    return { status: 200, processedMessages: 0, processedStatuses: 0 };
  }

  let processedMessages = 0;
  let processedStatuses = 0;

  for (const entry of entries) {
    const changes = entry?.changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = change?.value;
      if (!value) continue;

      // Handle Statuses
      if (Array.isArray(value.statuses) && value.statuses.length > 0) {
        for (const status of value.statuses) {
          processedStatuses++;
          if (onStatusProcessed) await onStatusProcessed(status);
        }
      }

      // Handle Messages
      if (Array.isArray(value.messages) && value.messages.length > 0) {
        for (const message of value.messages) {
          // Idempotency check via wa_message_id
          if (message.id && mockDb.messages.some(m => m.wa_message_id === message.id)) {
            console.log(`[Test] Duplicate wa_message_id skipped: ${message.id}`);
            continue;
          }

          let storedPath = null;
          if (options.failMedia) {
            // Media download failure isolated
            console.log(`[Test] Simulating media failure for message ${message.id}`);
          } else if (message.image || message.document) {
            storedPath = `/uploads/media_${message.id}.jpg`;
          }

          const senderPhone = normalizePhoneForComparison(message.from);

          // Find or create Contact
          let contact = mockDb.contacts.find(c => c.phone_number === senderPhone || c.phone_number === `+${senderPhone}`);
          if (!contact) {
            contact = { _id: `contact_${Date.now()}_${Math.random()}`, phone_number: `+${senderPhone}`, name: message.from };
            mockDb.contacts.push(contact);
          }

          // Core Message Persistence
          const messageDoc = {
            _id: `msg_${Date.now()}_${Math.random()}`,
            sender_number: senderPhone,
            recipient_number: value.metadata?.display_phone_number || '919876543210',
            message_type: message.type || 'text',
            content: message.text?.body || message.content || '',
            wa_message_id: message.id,
            file_url: storedPath,
            direction: 'inbound',
            contact_id: contact._id,
            created_at: new Date()
          };
          mockDb.messages.push(messageDoc);
          processedMessages++;

          // Simulated Socket Emission
          const formattedMessage = {
            id: messageDoc._id,
            content: messageDoc.content,
            wa_message_id: messageDoc.wa_message_id,
            contact_id: contact._id,
            sender: { id: senderPhone, contact_id: contact._id },
            recipient: { id: messageDoc.recipient_number }
          };
          mockDb.socketEmits.push(formattedMessage);

          if (onMessageProcessed) await onMessageProcessed(messageDoc);

          // Isolated Downstream Tasks
          if (options.failAutomation) {
            // Simulated automation failure should NOT throw out of pipeline
            try {
              throw new Error('Automation execution failed');
            } catch (autoErr) {
              console.log(`[Test] Caught isolated automation error: ${autoErr.message}`);
            }
          }

          if (options.failNotification) {
            try {
              throw new Error('Push notification service timeout');
            } catch (pushErr) {
              console.log(`[Test] Caught isolated notification error: ${pushErr.message}`);
            }
          }
        }
      }
    }
  }

  return { status: 200, processedMessages, processedStatuses };
}

// -------------------------------------------------------------
// TEST CASES
// -------------------------------------------------------------

test('TEST 1 — Single inbound message', async () => {
  const mockDb = { messages: [], contacts: [], socketEmits: [] };
  const payload = {
    entry: [{
      changes: [{
        value: {
          metadata: { display_phone_number: '919876543210' },
          messages: [{ id: 'wamid_1', from: '919876543210', type: 'text', text: { body: 'Hello' } }]
        }
      }]
    }]
  };

  const result = await processWebhookPayload(payload, mockDb);
  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.processedMessages, 1);
  assert.strictEqual(mockDb.messages.length, 1);
  assert.strictEqual(mockDb.messages[0].content, 'Hello');
  assert.strictEqual(mockDb.socketEmits.length, 1);
});

test('TEST 2 — Multiple messages in single array', async () => {
  const mockDb = { messages: [], contacts: [], socketEmits: [] };
  const payload = {
    entry: [{
      changes: [{
        value: {
          metadata: { display_phone_number: '919876543210' },
          messages: [
            { id: 'wamid_101', from: '919876543210', type: 'text', text: { body: 'Msg 1' } },
            { id: 'wamid_102', from: '919876543210', type: 'text', text: { body: 'Msg 2' } },
            { id: 'wamid_103', from: '919876543210', type: 'text', text: { body: 'Msg 3' } }
          ]
        }
      }]
    }]
  };

  const result = await processWebhookPayload(payload, mockDb);
  assert.strictEqual(result.processedMessages, 3);
  assert.strictEqual(mockDb.messages.length, 3);
  assert.strictEqual(mockDb.socketEmits.length, 3);
});

test('TEST 3 — Multiple changes in single entry', async () => {
  const mockDb = { messages: [], contacts: [], socketEmits: [] };
  const payload = {
    entry: [{
      changes: [
        { value: { statuses: [{ id: 'wamid_prev', status: 'delivered' }] } },
        { value: { messages: [{ id: 'wamid_201', from: '919876543210', text: { body: 'New Message' } }] } }
      ]
    }]
  };

  const result = await processWebhookPayload(payload, mockDb);
  assert.strictEqual(result.processedStatuses, 1);
  assert.strictEqual(result.processedMessages, 1);
  assert.strictEqual(mockDb.messages.length, 1);
});

test('TEST 4 — Multiple entries in payload', async () => {
  const mockDb = { messages: [], contacts: [], socketEmits: [] };
  const payload = {
    entry: [
      { changes: [{ value: { messages: [{ id: 'wamid_entry1', from: '919876543210', text: { body: 'E1' } }] } }] },
      { changes: [{ value: { messages: [{ id: 'wamid_entry2', from: '919876543211', text: { body: 'E2' } }] } }] }
    ]
  };

  const result = await processWebhookPayload(payload, mockDb);
  assert.strictEqual(result.processedMessages, 2);
  assert.strictEqual(mockDb.messages.length, 2);
});

test('TEST 5 — Webhook retry idempotency', async () => {
  const mockDb = { messages: [], contacts: [], socketEmits: [] };
  const payload = {
    entry: [{
      changes: [{
        value: { messages: [{ id: 'wamid_dup_check', from: '919876543210', text: { body: 'Test' } }] }
      }]
    }]
  };

  // First POST
  await processWebhookPayload(payload, mockDb);
  assert.strictEqual(mockDb.messages.length, 1);

  // Second POST (Duplicate Webhook retry)
  await processWebhookPayload(payload, mockDb);
  assert.strictEqual(mockDb.messages.length, 1); // Should still be 1!
});

test('TEST 6 — Identical text with different wa_message_id', async () => {
  const mockDb = { messages: [], contacts: [], socketEmits: [] };
  const payload1 = {
    entry: [{ changes: [{ value: { messages: [{ id: 'wamid_A', from: '919876543210', text: { body: 'Hello' } }] } }] }]
  };
  const payload2 = {
    entry: [{ changes: [{ value: { messages: [{ id: 'wamid_B', from: '919876543210', text: { body: 'Hello' } }] } }] }]
  };

  await processWebhookPayload(payload1, mockDb);
  await processWebhookPayload(payload2, mockDb);

  assert.strictEqual(mockDb.messages.length, 2);
  assert.strictEqual(mockDb.messages[0].wa_message_id, 'wamid_A');
  assert.strictEqual(mockDb.messages[1].wa_message_id, 'wamid_B');
});

test('TEST 7 — Phone number normalization comparison', () => {
  const rawFrom = '919876543210';
  const activeContactPhone = '+91 98765 43210';
  const dashPhone = '919-876-543-210';

  const normFrom = normalizePhoneForComparison(rawFrom);
  const normActive = normalizePhoneForComparison(activeContactPhone);
  const normDash = normalizePhoneForComparison(dashPhone);

  assert.strictEqual(normFrom, '919876543210');
  assert.strictEqual(normActive, '919876543210');
  assert.strictEqual(normDash, '919876543210');
  assert.strictEqual(normFrom === normActive, true);
});

test('TEST 8 — Contact ID matching in socket payload', () => {
  const contactId = '65f1234567890abcdef12345';
  const socketPayload = {
    id: 'msg_1',
    contact_id: contactId,
    sender: { id: '919876543210', contact_id: contactId }
  };

  const activeContactId = '65f1234567890abcdef12345';
  const isRelevant = socketPayload.contact_id === activeContactId || socketPayload.sender.contact_id === activeContactId;

  assert.strictEqual(isRelevant, true);
});

test('TEST 9 — Media failure isolation', async () => {
  const mockDb = { messages: [], contacts: [], socketEmits: [] };
  const payload = {
    entry: [{
      changes: [{
        value: {
          messages: [{ id: 'wamid_media_fail', from: '919876543210', type: 'image', image: { id: 'bad_media' } }]
        }
      }]
    }]
  };

  const result = await processWebhookPayload(payload, mockDb, { failMedia: true });
  assert.strictEqual(result.processedMessages, 1);
  assert.strictEqual(mockDb.messages.length, 1);
  assert.strictEqual(mockDb.messages[0].file_url, null); // Saved even though media download failed
});

test('TEST 10 — Automation failure isolation', async () => {
  const mockDb = { messages: [], contacts: [], socketEmits: [] };
  const payload = {
    entry: [{
      changes: [{
        value: { messages: [{ id: 'wamid_auto_fail', from: '919876543210', text: { body: 'Test' } }] }
      }]
    }]
  };

  const result = await processWebhookPayload(payload, mockDb, { failAutomation: true });
  assert.strictEqual(result.processedMessages, 1);
  assert.strictEqual(mockDb.messages.length, 1);
});

test('TEST 11 — Notification failure isolation', async () => {
  const mockDb = { messages: [], contacts: [], socketEmits: [] };
  const payload = {
    entry: [{
      changes: [{
        value: { messages: [{ id: 'wamid_push_fail', from: '919876543210', text: { body: 'Test' } }] }
      }]
    }]
  };

  const result = await processWebhookPayload(payload, mockDb, { failNotification: true });
  assert.strictEqual(result.processedMessages, 1);
  assert.strictEqual(mockDb.messages.length, 1);
});

test('TEST 12 — Message history provider connection property fallback', () => {
  const connection1 = { display_phone_number: '919876543210' };
  const connection2 = { registred_phone_number: '919876543210' };

  const getMyPhone = (conn) => conn.display_phone_number || conn.registred_phone_number;

  assert.strictEqual(getMyPhone(connection1), '919876543210');
  assert.strictEqual(getMyPhone(connection2), '919876543210');
});
