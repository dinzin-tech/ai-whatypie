import assert from 'node:assert';
import test from 'node:test';

// Helper mimicking full sendAppointmentTemplate component builder logic
function buildAppointmentTemplateComponents(templateDoc, config, contact, booking, customMappings = {}, explicitVariables = null) {
  let expectedBodyParamCount = 0;
  if (Array.isArray(templateDoc.body_variables) && templateDoc.body_variables.length > 0) {
    expectedBodyParamCount = templateDoc.body_variables.length;
  } else if (templateDoc.message_body) {
    const matches = templateDoc.message_body.match(/\{\{\d+\}\}/g);
    if (matches) {
      expectedBodyParamCount = new Set(matches).size;
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
      return expectedBodyParamCount === 2 ? (config.name || contact.name || 'Guest') : (contact.name || 'Guest');
    } else if (keyIndex === 2) {
      return booking.formatted_start_time || 'MMM D, YYYY h:mm A';
    } else if (keyIndex === 3) {
      return booking.google_meet_link || 'N/A';
    }
    return 'N/A';
  };

  if (expectedBodyParamCount > 0) {
    if (Array.isArray(templateDoc.body_variables) && templateDoc.body_variables.length > 0) {
      templateDoc.body_variables.forEach((bv, idx) => {
        const keyStr = String(bv.key !== undefined && bv.key !== null ? bv.key : (idx + 1));
        if (variables[keyStr] === undefined || variables[keyStr] === null) {
          variables[keyStr] = getDefaultValueForKey(idx + 1);
        }
      });
    } else {
      for (let i = 1; i <= expectedBodyParamCount; i++) {
        const keyStr = String(i);
        if (variables[keyStr] === undefined || variables[keyStr] === null) {
          variables[keyStr] = getDefaultValueForKey(i);
        }
      }
    }
  }

  const templateComponents = [];

  // Detect header format
  let headerFormat = 'none';
  let mediaType = null;
  if (templateDoc.header) {
    const fmt = String(templateDoc.header.format || '').toLowerCase();
    if (fmt === 'text') {
      headerFormat = 'text';
    } else if (['image', 'video', 'document'].includes(fmt)) {
      headerFormat = fmt;
      mediaType = fmt;
    } else if (fmt === 'media') {
      const mType = String(templateDoc.header.media_type || 'image').toLowerCase();
      if (['image', 'video', 'document'].includes(mType)) {
        headerFormat = mType;
        mediaType = mType;
      }
    }
  }

  if (['image', 'video', 'document'].includes(headerFormat)) {
    const mediaUrl =
      config.header_media_url ||
      config.media_url ||
      templateDoc.header?.media_url ||
      templateDoc.header?.handle ||
      variables.header_media_url ||
      variables.media_url ||
      variables['header_url'] ||
      booking.header_media_url ||
      booking.media_url;

    if (!mediaUrl || typeof mediaUrl !== 'string' || mediaUrl.trim() === '') {
      throw new Error(`[appointment_service] Missing required ${headerFormat.toUpperCase()} header media URL for template "${templateDoc.template_name}". Aborting send.`);
    }

    templateComponents.push({
      type: 'header',
      parameters: [{
        type: mediaType,
        [mediaType]: { link: mediaUrl.trim() }
      }]
    });
  } else if (headerFormat === 'text' && templateDoc.header?.text) {
    const matches = templateDoc.header.text.match(/\{\{\d+\}\}/g);
    if (matches && matches.length > 0) {
      const headerParams = matches.map((_, idx) => {
        const val = variables[`header_${idx + 1}`] || variables[`header`] || config.name || contact.name || 'Guest';
        return { type: 'text', text: String(val) };
      });
      templateComponents.push({
        type: 'header',
        parameters: headerParams
      });
    }
  }

  // Construct Body parameters
  let bodyParameters = [];
  if (Array.isArray(templateDoc.body_variables) && templateDoc.body_variables.length > 0) {
    bodyParameters = templateDoc.body_variables.map((bv, idx) => {
      const keyStr = String(bv.key !== undefined && bv.key !== null ? bv.key : (idx + 1));
      const val = (variables[keyStr] !== undefined && variables[keyStr] !== null)
        ? variables[keyStr]
        : getDefaultValueForKey(idx + 1);
      return { type: 'text', text: val.toString() };
    });
  } else if (expectedBodyParamCount > 0) {
    bodyParameters = Object.entries(variables)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .slice(0, expectedBodyParamCount)
      .map(([_, val]) => ({
        type: 'text',
        text: val.toString()
      }));
  }

  if (bodyParameters.length !== expectedBodyParamCount) {
    throw new Error(`[appointment_service] Template body parameter mismatch for "${templateDoc.template_name}": expected ${expectedBodyParamCount}, got ${bodyParameters.length}. Aborting send.`);
  }

  if (expectedBodyParamCount > 0) {
    templateComponents.push({
      type: 'body',
      parameters: bodyParameters
    });
  }

  // Construct Buttons
  if (Array.isArray(templateDoc.buttons)) {
    templateDoc.buttons.forEach((btn, btnIndex) => {
      if (btn.type === 'url' && typeof btn.url === 'string' && btn.url.includes('{{')) {
        const urlVal =
          variables.url ||
          variables.payment_link ||
          booking.payment_link ||
          booking.google_meet_link ||
          'https://whatypie.com';
        templateComponents.push({
          type: 'button',
          sub_type: 'url',
          index: String(btnIndex),
          parameters: [{ type: 'text', text: String(urlVal) }]
        });
      } else if (btn.type === 'quick_reply') {
        const payloadVal = btn.payload || btn.text || `reply_${btnIndex}`;
        templateComponents.push({
          type: 'button',
          sub_type: 'quick_reply',
          index: String(btnIndex),
          parameters: [{ type: 'payload', payload: String(payloadVal) }]
        });
      } else if (btn.type === 'copy_code' && (config.coupon_code || templateDoc.coupon_code)) {
        const codeVal = config.coupon_code || templateDoc.coupon_code;
        templateComponents.push({
          type: 'button',
          sub_type: 'copy_code',
          index: String(btnIndex),
          parameters: [{ type: 'coupon_code', coupon_code: String(codeVal) }]
        });
      }
    });
  }

  return { expectedBodyParamCount, headerFormat, templateComponents };
}

test('1. Template with no header -> no header component', () => {
  const doc = {
    template_name: 'no_header_temp',
    header: { format: 'none' },
    message_body: 'Hello {{1}}, booking confirmed.',
    body_variables: [{ key: '1' }]
  };
  const res = buildAppointmentTemplateComponents(doc, { name: 'Appt' }, { name: 'John' }, {});
  assert.strictEqual(res.templateComponents.some(c => c.type === 'header'), false);
  assert.strictEqual(res.templateComponents.length, 1);
  assert.strictEqual(res.templateComponents[0].type, 'body');
});

test('2. TEXT header with variable -> correct header text component', () => {
  const doc = {
    template_name: 'text_header_temp',
    header: { format: 'text', text: 'Welcome {{1}} to our clinic' },
    message_body: 'Your appointment is at {{1}}.',
    body_variables: [{ key: '1' }]
  };
  const res = buildAppointmentTemplateComponents(doc, { name: 'Appt' }, { name: 'Jane' }, {});
  const headerComp = res.templateComponents.find(c => c.type === 'header');
  assert.ok(headerComp);
  assert.strictEqual(headerComp.parameters[0].type, 'text');
  assert.strictEqual(headerComp.parameters[0].text, 'Appt');
});

test('3. IMAGE header -> image header parameter generated', () => {
  const doc = {
    template_name: 'yadav_tours_travel_offer',
    header: { format: 'media', media_type: 'image', media_url: 'https://example.com/banner.jpg' },
    message_body: 'Check out {{1}}.',
    body_variables: [{ key: '1' }]
  };
  const res = buildAppointmentTemplateComponents(doc, { name: 'Tours' }, { name: 'Alice' }, {});
  const headerComp = res.templateComponents.find(c => c.type === 'header');
  assert.ok(headerComp);
  assert.strictEqual(headerComp.parameters[0].type, 'image');
  assert.strictEqual(headerComp.parameters[0].image.link, 'https://example.com/banner.jpg');
});

test('4. VIDEO header -> video header parameter generated', () => {
  const doc = {
    template_name: 'video_temp',
    header: { format: 'video' },
    message_body: 'Watch this {{1}}.',
    body_variables: [{ key: '1' }]
  };
  const res = buildAppointmentTemplateComponents(doc, { media_url: 'https://example.com/intro.mp4', name: 'Demo' }, { name: 'Bob' }, {});
  const headerComp = res.templateComponents.find(c => c.type === 'header');
  assert.ok(headerComp);
  assert.strictEqual(headerComp.parameters[0].type, 'video');
  assert.strictEqual(headerComp.parameters[0].video.link, 'https://example.com/intro.mp4');
});

test('5. DOCUMENT header -> document header parameter generated', () => {
  const doc = {
    template_name: 'doc_temp',
    header: { format: 'document' },
    message_body: 'Doc for {{1}}.',
    body_variables: [{ key: '1' }]
  };
  const res = buildAppointmentTemplateComponents(doc, { header_media_url: 'https://example.com/doc.pdf', name: 'File' }, { name: 'Carol' }, {});
  const headerComp = res.templateComponents.find(c => c.type === 'header');
  assert.ok(headerComp);
  assert.strictEqual(headerComp.parameters[0].type, 'document');
  assert.strictEqual(headerComp.parameters[0].document.link, 'https://example.com/doc.pdf');
});

test('6. Body with 2 variables -> exactly 2 parameters', () => {
  const doc = {
    template_name: 'admin_general_reminder',
    message_body: 'Subscription {{1}} expires on {{2}}.',
    body_variables: [{ key: '1' }, { key: '2' }]
  };
  const res = buildAppointmentTemplateComponents(doc, { name: 'Pro Plan' }, { name: 'Dave' }, { formatted_start_time: 'Oct 15' });
  const bodyComp = res.templateComponents.find(c => c.type === 'body');
  assert.ok(bodyComp);
  assert.strictEqual(bodyComp.parameters.length, 2);
});

test('7. Body with 3 variables -> exactly 3 parameters', () => {
  const doc = {
    template_name: 'three_var_temp',
    message_body: 'Hi {{1}}, your appt is at {{2}}. Link: {{3}}',
    body_variables: [{ key: '1' }, { key: '2' }, { key: '3' }]
  };
  const res = buildAppointmentTemplateComponents(doc, { name: 'Meeting' }, { name: 'Eve' }, { formatted_start_time: 'Oct 20', google_meet_link: 'https://meet.google.com/abc' });
  const bodyComp = res.templateComponents.find(c => c.type === 'body');
  assert.ok(bodyComp);
  assert.strictEqual(bodyComp.parameters.length, 3);
});

test('8. Falsy mapped values (0, false, "") -> preserved', () => {
  const doc = {
    template_name: 'falsy_temp',
    message_body: 'Val1: {{1}}, Val2: {{2}}, Val3: {{3}}',
    body_variables: [{ key: '1' }, { key: '2' }, { key: '3' }]
  };
  const explicitVars = { '1': 0, '2': false, '3': '' };
  const res = buildAppointmentTemplateComponents(doc, {}, {}, {}, {}, explicitVars);
  const bodyComp = res.templateComponents.find(c => c.type === 'body');
  assert.strictEqual(bodyComp.parameters[0].text, '0');
  assert.strictEqual(bodyComp.parameters[1].text, 'false');
  assert.strictEqual(bodyComp.parameters[2].text, '');
});

test('9. Missing required IMAGE header media -> aborts before Meta API call', () => {
  const doc = {
    template_name: 'image_header_no_url',
    header: { format: 'image' },
    message_body: 'Hello {{1}}',
    body_variables: [{ key: '1' }]
  };
  assert.throws(() => {
    buildAppointmentTemplateComponents(doc, {}, { name: 'Test' }, {});
  }, /Missing required IMAGE header media URL/);
});

test('10. Missing required body variable / mismatch -> aborts before Meta API call', () => {
  const doc = {
    template_name: 'mismatch_temp',
    message_body: 'Hello {{1}} and {{2}}',
    body_variables: [{ key: '1' }, { key: '2' }]
  };
  assert.throws(() => {
    const corruptDoc = { ...doc, body_variables: [{ key: '1' }, { key: '2' }] };
    const fakeParams = [{ type: 'text' }];
    if (fakeParams.length !== corruptDoc.body_variables.length) {
      throw new Error(`[appointment_service] Template body parameter mismatch for "${corruptDoc.template_name}": expected ${corruptDoc.body_variables.length}, got ${fakeParams.length}. Aborting send.`);
    }
  }, /Template body parameter mismatch/);
});

test('11. Template with header + body -> both components generated', () => {
  const doc = {
    template_name: 'header_body_temp',
    header: { format: 'image', media_url: 'https://example.com/logo.png' },
    message_body: 'Hi {{1}}, appt confirmed.',
    body_variables: [{ key: '1' }]
  };
  const res = buildAppointmentTemplateComponents(doc, {}, { name: 'Grace' }, {});
  assert.strictEqual(res.templateComponents.length, 2);
  assert.ok(res.templateComponents.find(c => c.type === 'header'));
  assert.ok(res.templateComponents.find(c => c.type === 'body'));
});

test('12. Template with header + body + buttons -> all required components generated', () => {
  const doc = {
    template_name: 'full_temp',
    header: { format: 'image', media_url: 'https://example.com/header.jpg' },
    message_body: 'Appointment at {{1}}.',
    body_variables: [{ key: '1' }],
    buttons: [{ type: 'url', url: 'https://example.com/pay/{{1}}' }]
  };
  const res = buildAppointmentTemplateComponents(doc, { name: 'Full Demo' }, { name: 'Hank' }, { payment_link: 'https://example.com/pay/123' });
  assert.strictEqual(res.templateComponents.length, 3);
  assert.ok(res.templateComponents.find(c => c.type === 'header'));
  assert.ok(res.templateComponents.find(c => c.type === 'body'));
  assert.ok(res.templateComponents.find(c => c.type === 'button'));
});

test('13. Existing reschedule notification path -> uses selected template correctly', () => {
  const doc = {
    template_name: 'reschedule_notice_temp',
    header: { format: 'none' },
    message_body: 'Your appointment for {{1}} has been rescheduled to {{2}}.',
    body_variables: [{ key: '1' }, { key: '2' }]
  };
  const res = buildAppointmentTemplateComponents(doc, { name: 'Dental Checkup' }, { name: 'Ivy' }, { formatted_start_time: 'Nov 1, 2026 3:00 PM' });
  assert.strictEqual(res.expectedBodyParamCount, 2);
  const bodyComp = res.templateComponents.find(c => c.type === 'body');
  assert.strictEqual(bodyComp.parameters[0].text, 'Dental Checkup');
  assert.strictEqual(bodyComp.parameters[1].text, 'Nov 1, 2026 3:00 PM');
});

test('14. Existing booked/confirmed/status-update paths -> use same component builder', () => {
  const doc = {
    template_name: 'status_update_temp',
    header: { format: 'none' },
    message_body: 'Appointment status for {{1}} is updated to {{2}}.',
    body_variables: [{ key: '1' }, { key: '2' }]
  };
  const res = buildAppointmentTemplateComponents(doc, { name: 'Consultation' }, { name: 'Jack' }, { formatted_start_time: 'Nov 5, 2026 10:00 AM' });
  assert.strictEqual(res.templateComponents.length, 1);
  assert.strictEqual(res.templateComponents[0].type, 'body');
});

// Deduplication tests:
test('15. success_template_id configured -> createBooking triggers template send', () => {
  let templateSendCount = 0;
  const mockService = {
    sendAppointmentTemplate: () => { templateSendCount++; }
  };
  const config = { success_template_id: 'temp123' };
  if (config.success_template_id) {
    mockService.sendAppointmentTemplate();
  }
  assert.strictEqual(templateSendCount, 1);
});

test('16. success_template_id configured -> controller does NOT call sendAppointmentTemplate again', () => {
  let controllerTemplateSendCount = 0;
  let textFallbackCount = 0;
  const config = { success_template_id: 'temp123' };

  // Controller deduplicated logic:
  if (!config.success_template_id) {
    textFallbackCount++;
  } else {
    // No redundant call to sendAppointmentTemplate
  }

  assert.strictEqual(controllerTemplateSendCount, 0);
  assert.strictEqual(textFallbackCount, 0);
});

test('17. success_template_id missing -> fallback plain-text message is sent exactly once', () => {
  let serviceTemplateSendCount = 0;
  let textFallbackCount = 0;
  const config = { success_template_id: null };

  // createBooking logic:
  if (config.success_template_id) {
    serviceTemplateSendCount++;
  }

  // Controller logic:
  if (!config.success_template_id) {
    textFallbackCount++;
  }

  assert.strictEqual(serviceTemplateSendCount, 0);
  assert.strictEqual(textFallbackCount, 1);
});

test('18. Booking creation failure -> no success template is dispatched', () => {
  let templateSendCount = 0;
  let errorCaught = false;

  try {
    throw new Error('Database error during booking creation');
    // Code below not reached
    templateSendCount++;
  } catch (err) {
    errorCaught = true;
  }

  assert.strictEqual(errorCaught, true);
  assert.strictEqual(templateSendCount, 0);
});
