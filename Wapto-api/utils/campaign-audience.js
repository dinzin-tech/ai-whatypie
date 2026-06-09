import Contact from '../models/contact.model.js';

export const resolveDripAudience = async ({
  userId,
  recipient_type,
  specific_contacts = [],
  contact_numbers = [],
  tag_ids = [],
  segment_ids = [],
  opt_out_custom_field_key
}) => {
  let query = { user_id: userId, deleted_at: null };

  if (recipient_type === 'specific_contacts') {
    if (specific_contacts && specific_contacts.length > 0) {
      query._id = { $in: specific_contacts };
    } else if (contact_numbers && contact_numbers.length > 0) {
      query.phone_number = { $in: contact_numbers };
    } else {
      throw { statusCode: 400, message: 'No contacts provided' };
    }
  } else if (recipient_type === 'tags') {
    if (!tag_ids || tag_ids.length === 0) {
      throw { statusCode: 400, message: 'No tags provided' };
    }
    query.tags = { $in: tag_ids };
  } else if (recipient_type === 'segments') {
    if (!segment_ids || segment_ids.length === 0) {
      throw { statusCode: 400, message: 'No segments provided' };
    }
    query.segments = { $in: segment_ids };
  } else if (recipient_type === 'all_contacts') {
    // query all contacts for this user
  } else {
    throw { statusCode: 400, message: 'Invalid recipient type' };
  }

  const allMatchedContacts = await Contact.find(query).lean();
  const matchedCount = allMatchedContacts.length;

  let eligibleContacts = [];
  let skippedOptOutCount = 0;

  for (const contact of allMatchedContacts) {
    let optOut = false;
    
    if (opt_out_custom_field_key && contact.custom_fields) {
       const customFieldValue = contact.custom_fields[opt_out_custom_field_key];
       if (customFieldValue === 'true' || customFieldValue === true) {
         optOut = true;
       }
    }

    if (optOut) {
      skippedOptOutCount++;
    } else {
      eligibleContacts.push(contact);
    }
  }

  return {
    contacts: eligibleContacts,
    counts: {
      matchedCount,
      eligibleCount: eligibleContacts.length,
      skippedOptOutCount
    }
  };
};
