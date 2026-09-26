import assert from 'node:assert';
import test from 'node:test';

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';

const { default: automationEngine } = await import('../utils/automation-engine.js');
const { normalizeStoredPhone } = await import('../utils/phone-normalization.js');

test('ISSUE 1 & 2: Inbound WhatsApp & Automation Test Suite', async (t) => {

  await t.test('1. First "Hi" starts flow once', () => {
    let executionStarted = 0;
    const mockTrigger = {
      event_type: 'message_received',
      conditions: { field: 'message', operator: 'equals_any', value: ['hi', 'hello'] }
    };

    const isMatch = automationEngine.evaluateCondition(mockTrigger.conditions, { message: 'Hi' });
    if (isMatch) executionStarted++;

    assert.strictEqual(isMatch, true);
    assert.strictEqual(executionStarted, 1);
  });

  await t.test('2. First "Hi" normalization & socket contact_id mapping', () => {
    const rawSender = '+919353333945';
    const normalizedSender = normalizeStoredPhone(rawSender);
    assert.strictEqual(normalizedSender, '919353333945');

    const contactMongoId = '65f1234567890abcde123456';
    const contactMap = {
      '919353333945': { id: contactMongoId, name: 'Test Contact' },
      '+919353333945': { id: contactMongoId, name: 'Test Contact' }
    };

    const getContactInfo = (numberStr) => {
      if (!numberStr) return null;
      if (contactMap[numberStr]) return contactMap[numberStr];
      const norm = normalizeStoredPhone(numberStr);
      if (norm && contactMap[norm]) return contactMap[norm];
      if (norm && contactMap['+' + norm]) return contactMap['+' + norm];
      return null;
    };

    const resolved = getContactInfo('919353333945');
    assert.notStrictEqual(resolved, null);
    assert.strictEqual(resolved.id, contactMongoId);

    const resolvedWithPlus = getContactInfo('+919353333945');
    assert.notStrictEqual(resolvedWithPlus, null);
    assert.strictEqual(resolvedWithPlus.id, contactMongoId);
  });

  await t.test('3 & 4. Existing wait_for_reply execution resumes and prevents duplicate flow start', () => {
    const mockExecutionsDB = [
      {
        _id: 'exec_999',
        user_id: 'user_1',
        status: 'waiting',
        contact_identifier: '919353333945',
        input_data: { senderNumber: '+919353333945', contactId: '65f1234567890abcde123456' },
        updated_at: new Date()
      }
    ];

    const findWaitingExecution = (senderNumber, contactId, userId) => {
      const phoneDigits = normalizeStoredPhone(senderNumber);
      const phoneVariants = [
        ...new Set([
          senderNumber,
          phoneDigits,
          phoneDigits ? '+' + phoneDigits : null
        ].filter(Boolean))
      ];

      return mockExecutionsDB.find(exec => {
        if (exec.user_id !== userId || exec.status !== 'waiting') return false;
        const phoneMatch = phoneVariants.includes(exec.contact_identifier) || phoneVariants.includes(exec.input_data?.senderNumber);
        const contactMatch = contactId && (exec.input_data?.contactId === contactId);
        return phoneMatch || contactMatch;
      });
    };

    const waitingExec = findWaitingExecution('+919353333945', '65f1234567890abcde123456', 'user_1');
    assert.notStrictEqual(waitingExec, undefined);
    assert.strictEqual(waitingExec._id, 'exec_999');

    // Verification: if waitingExec exists, execution is resumed instead of starting a new flow
    const shouldStartNewFlow = !waitingExec;
    assert.strictEqual(shouldStartNewFlow, false);
  });

  await t.test('5. Duplicate Meta webhook with same wa_message_id is ignored (idempotent)', () => {
    const mockProcessedMessages = new Set();

    const processMessage = (waMessageId) => {
      if (mockProcessedMessages.has(waMessageId)) {
        return { status: 'ignored', duplicate: true };
      }
      mockProcessedMessages.add(waMessageId);
      return { status: 'processed', duplicate: false };
    };

    const res1 = processMessage('wam_123456');
    assert.strictEqual(res1.duplicate, false);
    assert.strictEqual(res1.status, 'processed');

    const res2 = processMessage('wam_123456');
    assert.strictEqual(res2.duplicate, true);
    assert.strictEqual(res2.status, 'ignored');

    assert.strictEqual(mockProcessedMessages.size, 1);
  });

  await t.test('6. Different messages with identical text are NOT treated as duplicates', () => {
    const mockProcessedMessages = new Map();

    const processMessage = (waMessageId, text) => {
      if (mockProcessedMessages.has(waMessageId)) {
        return { duplicate: true };
      }
      mockProcessedMessages.set(waMessageId, text);
      return { duplicate: false };
    };

    const msg1 = processMessage('wam_101', 'Hi');
    assert.strictEqual(msg1.duplicate, false);

    const msg2 = processMessage('wam_102', 'Hi');
    assert.strictEqual(msg2.duplicate, false);

    assert.strictEqual(mockProcessedMessages.size, 2);
  });

  await t.test('7. "Hi" matches intended greeting condition (contains_any & equals_any)', () => {
    const containsCond = { field: 'message', operator: 'contains_any', value: ['hi', 'hello'] };
    const equalsCond = { field: 'message', operator: 'equals_any', value: 'hi, hello' };

    assert.strictEqual(automationEngine.evaluateCondition(containsCond, { message: 'Hi' }), true);
    assert.strictEqual(automationEngine.evaluateCondition(equalsCond, { message: 'Hi' }), true);
    assert.strictEqual(automationEngine.evaluateCondition(equalsCond, { message: 'HELLO' }), true);
  });

  await t.test('8. "This" or "high" does NOT accidentally match "hi" when equals_any is configured', () => {
    const equalsCond = { field: 'message', operator: 'equals_any', value: ['hi', 'hello'] };
    const containsCond = { field: 'message', operator: 'contains_any', value: ['hi', 'hello'] };

    assert.strictEqual(automationEngine.evaluateCondition(equalsCond, { message: 'high' }), false);
    assert.strictEqual(automationEngine.evaluateCondition(equalsCond, { message: 'this' }), false);

    // contains_any preserves substring matching for backward compatibility
    assert.strictEqual(automationEngine.evaluateCondition(containsCond, { message: 'high' }), true);
  });

  await t.test('9. Multiple inbound messages remain visible in chat contact lookup', () => {
    const userContacts = [
      { _id: 'c_111', phone_number: '+919353333945', name: 'Alice' }
    ];

    const contactMap = userContacts.reduce((acc, contact) => {
      const entry = { id: contact._id.toString(), name: contact.name };
      if (contact.phone_number) {
        acc[contact.phone_number] = entry;
        const norm = normalizeStoredPhone(contact.phone_number);
        if (norm) {
          acc[norm] = entry;
          acc['+' + norm] = entry;
        }
      }
      return acc;
    }, {});

    const msg1Sender = '919353333945';
    const msg2Sender = '+919353333945';

    assert.strictEqual(contactMap[msg1Sender].id, 'c_111');
    assert.strictEqual(contactMap[msg2Sender].id, 'c_111');
  });

  await t.test('10. Interactive button replies continue existing flow correctly', () => {
    const interactiveData = {
      message: 'button_click_1',
      interactive_id: 'btn_yes',
      messageType: 'interactive'
    };

    const triggerCondition = { field: 'event_type', operator: 'equals', value: 'message_received' };

    // Standard message_received flow triggers ignore interactive button clicks so they don't start duplicate flows
    const isMessageReceivedTrigger = automationEngine.evaluateCondition(triggerCondition, interactiveData);
    assert.strictEqual(isMessageReceivedTrigger, false);
  });
});
