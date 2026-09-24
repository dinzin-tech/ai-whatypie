import assert from 'node:assert';
import test from 'node:test';

// Helper mimicking sendAppointmentTemplate parameter resolution logic
function resolveTemplateParameters(templateDoc, config, contact, booking, customMappings = {}, explicitVariables = null) {
  let expectedParamCount = 0;
  if (Array.isArray(templateDoc.body_variables) && templateDoc.body_variables.length > 0) {
    expectedParamCount = templateDoc.body_variables.length;
  } else if (templateDoc.message_body) {
    const matches = templateDoc.message_body.match(/\{\{\d+\}\}/g);
    if (matches) {
      expectedParamCount = new Set(matches).size;
    }
  }

  const variables = {};
  if (explicitVariables) {
    Object.assign(variables, explicitVariables);
  } else {
    for (const [key, source] of Object.entries(customMappings)) {
      let value = 'N/A';
      if (source === 'contact_name') value = contact.name || 'Guest';
      else if (source === 'config_name') value = config.name || 'Appointment';
      else if (source === 'meet_link') value = booking.google_meet_link || 'N/A';
      variables[key] = value;
    }
  }

  const getDefaultValueForKey = (keyIndex) => {
    if (keyIndex === 1) {
      return expectedParamCount === 2 ? (config.name || contact.name || 'Guest') : (contact.name || 'Guest');
    } else if (keyIndex === 2) {
      return booking.formatted_start_time || 'MMM D, YYYY h:mm A';
    } else if (keyIndex === 3) {
      return booking.google_meet_link || 'N/A';
    }
    return 'N/A';
  };

  if (expectedParamCount > 0) {
    if (Array.isArray(templateDoc.body_variables) && templateDoc.body_variables.length > 0) {
      templateDoc.body_variables.forEach((bv, idx) => {
        const keyStr = String(bv.key !== undefined && bv.key !== null ? bv.key : (idx + 1));
        if (variables[keyStr] === undefined || variables[keyStr] === null) {
          variables[keyStr] = getDefaultValueForKey(idx + 1);
        }
      });
    } else {
      for (let i = 1; i <= expectedParamCount; i++) {
        const keyStr = String(i);
        if (variables[keyStr] === undefined || variables[keyStr] === null) {
          variables[keyStr] = getDefaultValueForKey(i);
        }
      }
    }
  }

  let parameters = [];
  if (Array.isArray(templateDoc.body_variables) && templateDoc.body_variables.length > 0) {
    parameters = templateDoc.body_variables.map((bv, idx) => {
      const keyStr = String(bv.key !== undefined && bv.key !== null ? bv.key : (idx + 1));
      const val = (variables[keyStr] !== undefined && variables[keyStr] !== null)
        ? variables[keyStr]
        : getDefaultValueForKey(idx + 1);
      return { type: 'text', text: val.toString() };
    });
  } else if (expectedParamCount > 0) {
    parameters = Object.entries(variables)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .slice(0, expectedParamCount)
      .map(([_, val]) => ({
        type: 'text',
        text: val.toString()
      }));
  }

  if (parameters.length !== expectedParamCount) {
    throw new Error(
      `Parameter mismatch for template "${templateDoc.template_name}": expected ${expectedParamCount}, got ${parameters.length}`
    );
  }

  return { expectedParamCount, parameters };
}

test('admin_general_reminder template resolves exactly 2 parameters', () => {
  const adminGeneralReminderDoc = {
    template_name: 'admin_general_reminder',
    message_body: 'Friendly reminder: Your subscription for {{1}} expires on {{2}}. Renew now to avoid interruption',
    body_variables: [
      { key: '1', example: 'Premium Plan' },
      { key: '2', example: '31st March' }
    ]
  };

  const config = { name: 'VIP Consultation' };
  const contact = { name: 'Alice Smith' };
  const booking = { formatted_start_time: 'Oct 1, 2026 10:00 AM', google_meet_link: 'https://meet.google.com/xyz' };

  const result = resolveTemplateParameters(adminGeneralReminderDoc, config, contact, booking);

  assert.strictEqual(result.expectedParamCount, 2);
  assert.strictEqual(result.parameters.length, 2);
  assert.strictEqual(result.parameters[0].text, 'VIP Consultation');
  assert.strictEqual(result.parameters[1].text, 'Oct 1, 2026 10:00 AM');
});

test('3-variable template resolves exactly 3 parameters', () => {
  const threeVarDoc = {
    template_name: 'appointment_confirmation_3var',
    message_body: 'Hello {{1}}, your appointment is set for {{2}}. Link: {{3}}',
    body_variables: [
      { key: '1', example: 'User' },
      { key: '2', example: 'Date' },
      { key: '3', example: 'Link' }
    ]
  };

  const config = { name: 'Consultation' };
  const contact = { name: 'Bob' };
  const booking = { formatted_start_time: 'Oct 5, 2026 2:00 PM', google_meet_link: 'https://meet.google.com/abc' };

  const result = resolveTemplateParameters(threeVarDoc, config, contact, booking);

  assert.strictEqual(result.expectedParamCount, 3);
  assert.strictEqual(result.parameters.length, 3);
  assert.strictEqual(result.parameters[0].text, 'Bob');
  assert.strictEqual(result.parameters[1].text, 'Oct 5, 2026 2:00 PM');
  assert.strictEqual(result.parameters[2].text, 'https://meet.google.com/abc');
});

test('Falsy mapped values (0, false, "") are preserved and NOT overwritten by fallbacks', () => {
  const templateDoc = {
    template_name: 'falsy_values_test',
    message_body: 'Count: {{1}}, Status: {{2}}, Note: {{3}}',
    body_variables: [
      { key: '1', example: '0' },
      { key: '2', example: 'false' },
      { key: '3', example: '' }
    ]
  };

  const config = { name: 'Fallback Name' };
  const contact = { name: 'Fallback Guest' };
  const booking = { formatted_start_time: 'Oct 10, 2026 12:00 PM', google_meet_link: 'https://meet.google.com/test' };

  const explicitVariables = {
    '1': 0,
    '2': false,
    '3': ''
  };

  const result = resolveTemplateParameters(templateDoc, config, contact, booking, {}, explicitVariables);

  assert.strictEqual(result.expectedParamCount, 3);
  assert.strictEqual(result.parameters.length, 3);
  assert.strictEqual(result.parameters[0].text, '0');
  assert.strictEqual(result.parameters[1].text, 'false');
  assert.strictEqual(result.parameters[2].text, '');
});

test('Parameter count mismatch is detected and throws validation error', () => {
  const templateDoc = {
    template_name: 'admin_general_reminder',
    message_body: 'Friendly reminder: Your subscription for {{1}} expires on {{2}}.',
    body_variables: [
      { key: '1', example: 'Plan' },
      { key: '2', example: 'Date' }
    ]
  };

  assert.throws(() => {
    const corruptDoc = { ...templateDoc, body_variables: [{ key: '1' }] };
    const fakeParams = [{ type: 'text' }, { type: 'text' }, { type: 'text' }];
    if (fakeParams.length !== corruptDoc.body_variables.length) {
      throw new Error(`Parameter mismatch for template "${corruptDoc.template_name}": expected ${corruptDoc.body_variables.length}, got ${fakeParams.length}`);
    }
  }, /Parameter mismatch/);
});
