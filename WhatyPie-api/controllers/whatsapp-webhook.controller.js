import { WhatsappPhoneNumber, Message, EcommerceOrder, User, AppointmentBooking, AppointmentConfig, Contact, FacebookAdCampaign, AutomationFlow } from '../models/index.js';
import moment from 'moment';
import {
  isWithinWorkingHours,
  findMatchingBot,
  sendAutomatedReply,
  assignRoundRobin
} from '../utils/automated-response.service.js';
import db from '../models/index.js';
const { WabaConfiguration } = db;
import { parseIncomingMessage, getWhatsAppMediaUrl, downloadAndStoreMedia } from '../utils/whatsapp-message-handler.js';
import automationEngine from '../utils/automation-engine.js';
import { updateWhatsAppStatus } from '../utils/message-status.service.js';
import { updateCampaignStatsFromWhatsApp } from '../utils/campaign-stats.service.js';
import { sendPushNotification } from '../utils/one-signal.js';
import { normalizeStoredPhone } from '../utils/phone-normalization.js';


export const handleWebhookVerification = (req, res) => {
  console.log("called");
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};




export const handleIncomingMessage = async (req, res, io = null) => {
  try {
    console.log("WhatsApp webhook called");

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages) {
      return res.sendStatus(200);
    }

    const message = value.messages[0];
    const senderPhone = normalizeStoredPhone(message.from) || message.from;
    const phoneNumberId = value.metadata.phone_number_id;

    console.log('Incoming message detail:', { phoneNumberId, type: message.type, from: message.from, id: message.id });

    let whatsappPhoneNumber = await WhatsappPhoneNumber.findOne({
      phone_number_id: phoneNumberId
    })
      .populate('waba_id')
      .lean();

    if (!whatsappPhoneNumber || !whatsappPhoneNumber.waba_id) {
      console.log(`WhatsApp phone number not found for phone_number_id: ${phoneNumberId}. Checking fallback...`);
      whatsappPhoneNumber = await WhatsappPhoneNumber.findOne({ 
        display_phone_number: { "$regex": message.from.replace('+', '') } 
      }).populate('waba_id').lean();
      
      console.log('Fallback lookup result:', whatsappPhoneNumber ? 'Found' : 'Not Found');
      
      if (!whatsappPhoneNumber || !whatsappPhoneNumber.waba_id) {
        return res.sendStatus(200);
      }
    }

    const { access_token } = whatsappPhoneNumber.waba_id;

    const {
      content,
      mediaId,
      fileType,
      mimeType,
      interactiveId,
      interactiveData,
      replyMessageId,
      reactionMessageId,
      reactionEmoji
    } = parseIncomingMessage(message);

    let mediaUrl = null;
    let storedPath = null;

    if (mediaId) {
      try {
        mediaUrl = await getWhatsAppMediaUrl(mediaId, access_token);
        storedPath = await downloadAndStoreMedia(
          mediaUrl,
          access_token,
          mimeType,
          fileType,
          whatsappPhoneNumber.user_id
        );
      } catch (mediaErr) {
        console.error(`[Webhook] Failed to download media (id=${mediaId}):`, mediaErr.message);
      }
    }

    const contact = await import('../models/index.js');
    const Contact = contact.Contact;
    const userId = whatsappPhoneNumber.user_id;
    let contactDoc = await Contact.findOne({
      phone_number: senderPhone,
      user_id: userId,
      deleted_at: null
    });

    if (!contactDoc) {
      const softDeletedContact = await Contact.findOne({
        phone_number: senderPhone,
        user_id: userId,
        deleted_at: { $ne: null }
      });

      if (softDeletedContact) {
        softDeletedContact.deleted_at = null;
        softDeletedContact.name = softDeletedContact.name || senderPhone;
        softDeletedContact.source = softDeletedContact.source || 'whatsapp';
        await softDeletedContact.save();
        contactDoc = softDeletedContact;
      }
    }

    if (!contactDoc) {
      try {
        contactDoc = await Contact.create({
          phone_number: senderPhone,
          name: senderPhone,
          source: 'whatsapp',
          user_id: userId,
          created_by: userId,
          status: 'lead'
        });
      } catch (createErr) {
        if (createErr?.code === 11000) {
          contactDoc = await Contact.findOne({
            phone_number: senderPhone,
            user_id: userId,
            deleted_at: null
          });
        } else {
          throw createErr;
        }
      }
    }


    contactDoc = await Contact.findById(contactDoc._id);

    let automatedHandled = false;

    const messageDoc = await Message.create({
      sender_number: message.from,
      recipient_number: whatsappPhoneNumber.display_phone_number,
      whatsapp_connection_id: whatsappPhoneNumber._id,
      message_type: message.type,
      content,
      wa_message_id: message.id,
      wa_media_id: mediaId,
      file_url: storedPath,
      file_type: fileType,
      from_me: false,
      direction: "inbound",
      wa_timestamp: new Date(Number(message.timestamp) * 1000),
      metadata: message,
      user_id: whatsappPhoneNumber.user_id,
      contact_id: contactDoc._id,
      interactive_data: interactiveData,
      provider: 'business_api',
      reply_message_id: replyMessageId,
      reaction_message_id: reactionMessageId
    });

  
    if (message.referral && message.referral.source_id && message.referral.source_type === 'ad') {
      try {
        const adId = message.referral.source_id;
        console.log(`[Webhook] Ad Referral detected: source_id=${adId}`);

        const campaign = await FacebookAdCampaign.findOne({ fb_ad_id: adId }).lean();

        if (campaign && campaign.automation_trigger && campaign.automation_trigger.type_name !== 'none') {
          const trigger = campaign.automation_trigger;
          console.log(`[Webhook] Found linked automation: ${trigger.type_name} (${trigger.id})`);

          if (trigger.type_name === 'reply_material') {
            await sendAutomatedReply({
              wabaId: whatsappPhoneNumber.waba_id._id || whatsappPhoneNumber.waba_id,
              contactId: contactDoc._id,
              replyType: 'reply_material',
              replyId: trigger.id,
              senderNumber: message.from,
              incomingText: content,
              userId: whatsappPhoneNumber.user_id,
              whatsappPhoneNumberId: whatsappPhoneNumber._id
            });
            automatedHandled = true;
          } else if (trigger.type_name === 'workflow') {
            const flow = await AutomationFlow.findById(trigger.id).lean();
            if (flow && flow.is_active) {
              await automationEngine.executeFlow(flow, {
                message: content,
                senderNumber: message.from,
                recipientNumber: whatsappPhoneNumber.display_phone_number,
                messageType: message.type,
                userId: whatsappPhoneNumber.user_id.toString(),
                whatsappPhoneNumberId: whatsappPhoneNumber._id.toString(),
                waMessageId: message.id,
                contactId: contactDoc._id.toString(),
                timestamp: new Date(Number(message.timestamp) * 1000),
                event_type: 'ad_click'
              });
              automatedHandled = true;
            }
          }
        }
      } catch (attrError) {
        console.error('[Webhook] Error handling ad referral attribution:', attrError);
      }
    }

    if (io) {
      const populatedMessage = await Message.findById(messageDoc._id)
        .populate({
          path: 'template_id',
          select: 'template_name language category status message_body body_variables header footer_text buttons meta_template_id'
        })
        .populate('submission_id')
        .lean();

      const senderNumber = populatedMessage.sender_number;
      const recipientNumber = populatedMessage.recipient_number;

      const formattedMessage = {
        id: populatedMessage._id.toString(),
        content: populatedMessage.content,
        interactiveData: populatedMessage.interactive_data,
        messageType: populatedMessage.message_type,
        fileUrl: populatedMessage.file_url || null,
        template: populatedMessage.template_id || null,
        createdAt: populatedMessage.wa_timestamp,
        can_chat: true,
        delivered_at: populatedMessage.delivered_at || null,
        delivery_status: populatedMessage.delivery_status || 'pending',
        is_delivered: populatedMessage.is_delivered || false,
        is_seen: populatedMessage.is_seen || false,
        seen_at: populatedMessage.seen_at || null,
        wa_status: populatedMessage.wa_status || null,
        wa_message_id: populatedMessage.wa_message_id || null,
        direction: populatedMessage.direction || null,
        reply_message_id: populatedMessage.reply_message_id || null,
        reaction_message_id: populatedMessage.reaction_message_id || null,
        sender: {
          id: senderNumber,
          name: senderNumber
        },
        recipient: {
          id: recipientNumber,
          name: recipientNumber
        },
        submission_id: populatedMessage.submission_id?._id || populatedMessage.submission_id || null,
        fields: populatedMessage.submission_id?.fields || [],
        user_id: populatedMessage.user_id?.toString(),
        whatsapp_phone_number_id: whatsappPhoneNumber._id?.toString()
      };

      if (formattedMessage.reply_message_id) {
        const replyMsg = await Message.findOne({ wa_message_id: formattedMessage.reply_message_id }).lean();
        if (replyMsg) {
          formattedMessage.reply_message = {
            id: replyMsg._id.toString(),
            content: replyMsg.content,
            interactiveData: replyMsg.interactive_data,
            messageType: replyMsg.message_type,
            fileUrl: replyMsg.file_url || null,
            template: replyMsg.template_id || null,
            createdAt: replyMsg.wa_timestamp,
            wa_message_id: replyMsg.wa_message_id || null,
            direction: replyMsg.direction || null,
            sender: {
              id: replyMsg.sender_number,
              name: replyMsg.sender_number
            }
          };
        }
      }

      io.emit('whatsapp:message', formattedMessage);
    }

    try {
      const notificationContent = content || (fileType ? `Received ${fileType}` : 'New message');
      const senderName = contactDoc.name || message.from;
      const user = await User.findById(whatsappPhoneNumber.user_id)
        .select('player_id')
        .lean();

      await sendPushNotification({
        userIds: user.player_id,
        heading: `New message from ${senderName}`,
        content: notificationContent.length > 100 ? notificationContent.substring(0, 97) + '...' : notificationContent,
        data: {
          contact_id: contactDoc._id.toString(),
          wa_message_id: message.id,
          sender_number: message.from,
          type: 'incoming_message'
        }
      });
    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
    }

    const metadata = contactDoc.metadata || {};
    const waitingType = metadata.automation_waiting_type;
    const configId = metadata.automation_waiting_config_id;
    const bookingId = metadata.automation_current_booking_id;

    if (message.type === 'interactive' && (waitingType || bookingId)) {
      console.log(`[PIVOTAL] Entering Clinical Priority Handler: WaitingType=${waitingType}, BookingId=${bookingId}`);
      console.log(`[PIVOTAL] Metadata Dump: ${JSON.stringify(metadata)}`);
    }

    if (waitingType === 'appointment_question' && message.type === 'text') {
      try {
        const inputData = JSON.parse(metadata.automation_input_data || "{}");
        const answers = inputData.appointment_answers || {};
        const questionId = metadata.automation_current_question_id;

        if (questionId) {
          answers[questionId] = content;
          inputData.appointment_answers = answers;

          contactDoc.metadata.automation_waiting_type = null;
          contactDoc.markModified('metadata');
          await contactDoc.save();

          const { default: appointmentService } = await import('../services/appointment.service.js');
          console.log(`[PIVOTAL] Resuming Questionnaire. Handing off to startConversationalFlow.`);
          await appointmentService.startConversationalFlow({
            userId: whatsappPhoneNumber.user_id,
            contactId: contactDoc._id,
            configId: metadata.automation_waiting_config_id,
            whatsappPhoneNumberId: whatsappPhoneNumber._id,
            inputData: inputData
          });
          return res.sendStatus(200);
        }
      } catch (err) {
        console.error("[PIVOTAL] Error resuming questionnaire:", err);
      }
    }
    else if (message.type === 'interactive' && message.interactive?.type === 'list_reply' && waitingType?.startsWith('appointment_')) {
      const selectionId = message.interactive.list_reply.id;
      try {
        const { default: appointmentService } = await import('../services/appointment.service.js');
        const inputData = JSON.parse(metadata.automation_input_data || "{}");

        if (waitingType === 'appointment_date_selection' && selectionId.startsWith('date_')) {
          const selectedDate = selectionId.replace('date_', '');
          console.log(`[PIVOTAL] Date selection detected: ${selectedDate}`);
          await appointmentService.sendTimeSelection(whatsappPhoneNumber.user_id, contactDoc._id, configId, selectedDate, whatsappPhoneNumber._id, inputData);
          return res.sendStatus(200);
        }
        else if (waitingType === 'appointment_time_selection' && selectionId.startsWith('slot_')) {
          const slotStart = selectionId.replace('slot_', '');
          console.log(`[PIVOTAL] Slot selection detected: ${slotStart}`);
          const { AppointmentConfig } = await import('../models/index.js');
          const config = await AppointmentConfig.findById(configId).lean();

          const duration = config?.duration_minutes || 30;
          const startTime = new Date(slotStart);
          const endTime = new Date(startTime.getTime() + duration * 60000);
          const rescheduleBookingId = metadata.automation_reschedule_booking_id;

          if (rescheduleBookingId) {
            await appointmentService.rescheduleBooking(rescheduleBookingId, startTime.toISOString(), endTime.toISOString(), whatsappPhoneNumber._id);
            contactDoc.metadata.automation_waiting_type = null;
            contactDoc.metadata.automation_reschedule_booking_id = null;
            contactDoc.markModified('metadata');
            await contactDoc.save();
          } else {
            const booking = await appointmentService.createBooking({
              configId,
              contactId: contactDoc._id,
              userId: whatsappPhoneNumber.user_id,
              startTime,
              endTime: endTime.toISOString(),
              answers: inputData.appointment_answers || {},
              whatsappPhoneNumberId: whatsappPhoneNumber._id
            });

            console.log(`[PIVOTAL] Booking Created: ${booking._id}. Sending confirmation...`);

            // Clear waiting state — booking is done
            contactDoc.metadata.automation_waiting_type = null;
            contactDoc.metadata.automation_waiting_config_id = null;
            contactDoc.markModified('metadata');
            await contactDoc.save();

            // If a success template is configured, send it
            if (config.success_template_id) {
              await appointmentService.sendAppointmentTemplate(
                whatsappPhoneNumber.user_id,
                contactDoc._id,
                config.success_template_id,
                booking,
                'success',
                whatsappPhoneNumber._id
              );
            } else {
              // Fallback: send a friendly plain-text confirmation
              const { default: unifiedWhatsAppService } = await import('../services/whatsapp/unified-whatsapp.service.js');
              const visitDate = moment(startTime).format('dddd, MMM D, YYYY');
              const visitTime = moment(startTime).format('h:mm A');
              const locationLine = config.location ? `\n📍 Location: ${config.location}` : '';
              await unifiedWhatsAppService.sendMessage(whatsappPhoneNumber.user_id, {
                recipientNumber: contactDoc.phone_number,
                messageType: 'text',
                messageText: `✅ *Site Visit Confirmed!*\n\n📅 Date: ${visitDate}\n⏰ Time: ${visitTime}${locationLine}\n\nOur expert will be there to guide you personally. See you soon! 🏡\n\n_Reply *reschedule* or *cancel* if your plans change._`,
                whatsappPhoneNumberId: whatsappPhoneNumber._id
              });
            }

          }
          return res.sendStatus(200);
        }
      } catch (err) {
        console.error("[PIVOTAL] Error handling appointment list reply:", err);
      }
    }
    else if (message.type === 'interactive' && message.interactive?.type === 'button_reply' && (waitingType === 'appointment_status_selection' || bookingId)) {
      const buttonId = message.interactive.button_reply.id;
      if (buttonId.startsWith('status_')) {
        try {
          const { default: appointmentService } = await import('../services/appointment.service.js');
          console.log(`[PIVOTAL] Status Update detected: ${buttonId} for Booking: ${bookingId}`);

          if (buttonId === 'status_confirm') {
            if (!bookingId) {
              console.error(`[PIVOTAL] Error: status_confirm clicked but bookingId is null in metadata.`);
              return res.sendStatus(200);
            }
            const booking = await AppointmentBooking.findByIdAndUpdate(bookingId, { status: 'confirmed' }, { returnDocument: 'after' });
            if (!booking) {
              console.error(`[PIVOTAL] Error: Booking document ${bookingId} not found during confirmation.`);
              return res.sendStatus(200);
            }
            const config = await AppointmentConfig.findById(booking.config_id).lean();

            if (config?.confirm_template_id) {
              await appointmentService.sendAppointmentTemplate(whatsappPhoneNumber.user_id, contactDoc._id, config.confirm_template_id, booking, 'confirm', whatsappPhoneNumber._id);
            }
            contactDoc.metadata.automation_waiting_type = null;
          }
          else if (buttonId === 'status_cancel') {
            if (bookingId) {
              await appointmentService.cancelBooking(bookingId, whatsappPhoneNumber._id);
            }
            contactDoc.metadata.automation_waiting_type = null;
          }
          else if (buttonId === 'status_reschedule') {
            if (!bookingId) {
              console.error(`[PIVOTAL] Error: status_reschedule clicked but bookingId is null.`);
              return res.sendStatus(200);
            }
            const inputData = JSON.parse(metadata.automation_input_data || "{}");
            contactDoc.metadata.automation_reschedule_booking_id = bookingId;
            contactDoc.markModified('metadata');
            await contactDoc.save();
            await appointmentService.sendDateSelection(whatsappPhoneNumber.user_id, contactDoc._id, configId, whatsappPhoneNumber._id, inputData);
            return res.sendStatus(200);
          }

          contactDoc.markModified('metadata');
          await contactDoc.save();
          return res.sendStatus(200);
        } catch (err) {
          console.error("[PIVOTAL] Error handling appointment status button:", err);
        }
      }
    }

    if (message.type === 'interactive' && message.interactive?.type === 'nfm_reply') {
      try {
        const { default: appointmentWebhookService } = await import('../services/whatsapp/appointment-webhook.service.js');
        const handled = await appointmentWebhookService.handleFlowResponse(message, contactDoc);

        if (!handled) {
          const { default: metaFlowService } = await import('../services/whatsapp/meta-flow.service.js');
          const submission = await metaFlowService.handleFlowSubmission(message, whatsappPhoneNumber, contactDoc);
          if (submission?._id) {
            messageDoc.submission_id = submission._id;
            await messageDoc.save();
            console.log(`[Webhook] Linked submission ${submission._id} to message ${messageDoc._id}`);
          }
        }
      } catch (err) {
        console.error("Error processing meta-flow/appointment submission:", err);
      }
    }


    if (message.order) {
      try {
        const order = message.order;

        const items = Array.isArray(order.product_items)
          ? order.product_items.map((item) => ({
            product_retailer_id: item.product_retailer_id || item.retailer_id || null,
            quantity: Number(item.quantity) || 1,
            price: item.item_price ? Number(item.item_price) : null,
            name: item.name || null,
            raw: item
          }))
          : [];

        const totalPrice = items.reduce(
          (sum, it) => (it.price && it.quantity ? sum + it.price * it.quantity : sum),
          0
        );

        const createdOrder = await EcommerceOrder.create({
          user_id: whatsappPhoneNumber.user_id,
          phone_no_id: whatsappPhoneNumber._id,
          contact_id: contactDoc._id,
          wa_message_id: message.id,
          wa_order_id: order.id || null,
          currency: order.currency || null,
          total_price: Number.isFinite(totalPrice) ? totalPrice : null,
          items,
          raw_payload: message
        });

        try {
          await automationEngine.triggerEvent("order_received", {
            order_id: createdOrder._id?.toString(),
            wa_order_id: createdOrder.wa_order_id,
            wa_message_id: createdOrder.wa_message_id,
            total_price: createdOrder.total_price,
            currency: createdOrder.currency,
            items_count: Array.isArray(createdOrder.items) ? createdOrder.items.length : 0,
            senderNumber: message.from,
            recipientNumber: whatsappPhoneNumber.display_phone_number,
            userId: whatsappPhoneNumber.user_id.toString(),
            whatsappPhoneNumberId: whatsappPhoneNumber._id.toString(),
            contactId: contactDoc._id.toString(),
            timestamp: new Date(Number(message.timestamp) * 1000)
          });
        } catch (automationOrderError) {
          console.error('Error triggering order_received automation:', automationOrderError);
        }
      } catch (orderError) {
        console.error('Error saving WhatsApp order:', orderError);
      }
    }


    try {
      const isFlowInteractive = interactiveId && String(interactiveId).includes('___');
      const automationMessage = isFlowInteractive ? interactiveId : content;

      await automationEngine.triggerEvent("message_received", {
        message: automationMessage,
        interactive_id: interactiveId,
        senderNumber: message.from,
        recipientNumber: whatsappPhoneNumber.display_phone_number,
        messageType: message.type,
        userId: whatsappPhoneNumber.user_id.toString(),
        whatsappPhoneNumberId: whatsappPhoneNumber._id.toString(),
        waMessageId: message.id,
        waJid: message.from,
        contactId: contactDoc?._id?.toString(),
        timestamp: new Date(Number(message.timestamp) * 1000),
      });
    } catch (automationError) {
      console.error('Error triggering automation:', automationError);
    }



    try {
      const wabaId = whatsappPhoneNumber.waba_id._id || whatsappPhoneNumber.waba_id;
      const config = await WabaConfiguration.findOne({ waba_id: wabaId });

      contactDoc.last_incoming_message_at = new Date();
      if (!contactDoc.user_id) {
        contactDoc.user_id = whatsappPhoneNumber.user_id;
      }
      await contactDoc.save();

      const chatAssignment = await db.ChatAssignment.findOne({
        sender_number: message.from,
        whatsapp_phone_number_id: whatsappPhoneNumber._id,
        status: 'assigned'
      }).lean();

      if (chatAssignment && chatAssignment.chatbot_id) {
        const isExpired = chatAssignment.chatbot_expires_at && new Date() > new Date(chatAssignment.chatbot_expires_at);
        if (!isExpired) {
          console.log(`[Webhook] Forwarding message to assigned chatbot ${chatAssignment.chatbot_id}`);
          await sendAutomatedReply({
            wabaId,
            contactId: contactDoc._id,
            replyType: 'chatbot',
            replyId: chatAssignment.chatbot_id,
            senderNumber: message.from,
            incomingText: content,
            userId: whatsappPhoneNumber.user_id,
            whatsappPhoneNumberId: whatsappPhoneNumber._id
          });
          automatedHandled = true;
        } else {
          console.log(`[Webhook] Chatbot assignment expired for ${message.from}`);
          await db.ChatAssignment.findByIdAndUpdate(chatAssignment._id, { chatbot_id: null, chatbot_expires_at: null });
        }
      }

      const open = await isWithinWorkingHours(wabaId);
      if (!open && config?.out_of_working_hours?.id) {
        await sendAutomatedReply({
          wabaId,
          contactId: contactDoc._id,
          replyType: config.out_of_working_hours.type,
          replyId: config.out_of_working_hours.id,
          senderNumber: message.from,
          incomingText: content,
          userId: whatsappPhoneNumber.user_id,
          whatsappPhoneNumberId: whatsappPhoneNumber._id
        });
        automatedHandled = true;
      }

      if (!automatedHandled) {
        const matchingBot = await findMatchingBot(wabaId, content);
        if (matchingBot) {
          await sendAutomatedReply({
            wabaId,
            contactId: contactDoc._id,
            replyType: matchingBot.reply_type,
            replyId: matchingBot.reply_id,
            senderNumber: message.from,
            incomingText: content,
            userId: whatsappPhoneNumber.user_id,
            whatsappPhoneNumberId: whatsappPhoneNumber._id
          });
          automatedHandled = true;

          if (matchingBot.chatbot_id) {
            const chatbot = await db.Chatbot.findById(matchingBot.chatbot_id).lean();
            if (chatbot && chatbot.session_limit_minutes) {
              const expiresAt = new Date(Date.now() + chatbot.session_limit_minutes * 60000);
              await db.ChatAssignment.findOneAndUpdate(
                { sender_number: message.from, whatsapp_phone_number_id: whatsappPhoneNumber._id },
                { chatbot_id: matchingBot.chatbot_id, chatbot_expires_at: expiresAt, status: 'assigned' },
                { upsert: true }
              );
            }
          }
        }
      }

      if (!automatedHandled) {
        await assignRoundRobin(wabaId, contactDoc._id, whatsappPhoneNumber._id);
      }

    } catch (automationErr) {
      console.error('Error in post-save automation:', automationErr);
    }

    res.sendStatus(200);

  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    res.sendStatus(200);
  }
};


export const handleStatusUpdate = async (req, res, io = null) => {
  try {
    console.log("WhatsApp status webhook called");

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.statuses) {
      return res.sendStatus(200);
    }

    const status = value.statuses[0];
    const waMessageId = status.id;
    const statusType = status.status;
    const timestamp = new Date(Number(status.timestamp) * 1000);

    console.log(`Processing status update for message ${waMessageId}: ${statusType}`);

    try {
      const updatedMessage = await updateWhatsAppStatus(waMessageId, statusType, timestamp);

      try {
        const { updateCampaignStatsFromWhatsApp } = await import('../utils/campaign-stats.service.js');
        const result = await updateCampaignStatsFromWhatsApp(waMessageId, statusType, timestamp);
        console.log(`Campaign stats update result for ${waMessageId}:`, result);
      } catch (campaignError) {
        console.error(`Error updating campaign stats for message ${waMessageId}:`, campaignError);
      }

      if (updatedMessage) {
        await automationEngine.triggerEvent("status_update", {
          waMessageId: waMessageId,
          status: statusType,
          timestamp: timestamp,
          recipientId: status.recipient_id,
          messageId: updatedMessage._id.toString(),
          userId: updatedMessage.user_id?.toString()
        });

        console.log(`Status updated successfully for message ${waMessageId}`);
      } else {
        console.log(`Status update processed for call: ${waMessageId}`);
      }

    } catch (updateError) {
      console.error(`Error updating status for message ${waMessageId}:`, updateError);
    }

    res.sendStatus(200);

  } catch (error) {
    console.error("WhatsApp status webhook error:", error);
    res.sendStatus(200);
  }
};
