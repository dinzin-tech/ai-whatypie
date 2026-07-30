import axios from 'axios';
import mongoose from 'mongoose';

import { WhatsappPhoneNumber } from '../../models/index.js';
import webrtcService from './webrtc.service.js';

const WHATSAPP_API_VERSION = 'v23.0';
const WHATSAPP_GRAPH_API_APP_URL = 'https://graph.facebook.com';

class WhatsappCallingService {

    async findPhoneRecord(phoneRef, ownerUserId = null) {
        const orConditions = [];

        if (mongoose.Types.ObjectId.isValid(phoneRef)) {
            orConditions.push({ _id: phoneRef });
        }
        orConditions.push({ phone_number_id: String(phoneRef) });

        const query = {
            $or: orConditions,
            deleted_at: null
        };

        if (ownerUserId) {
            query.user_id = ownerUserId;
        }

        return WhatsappPhoneNumber.findOne(query).populate('waba_id');
    }

    async getAccessTokenForPhone(metaPhoneNumberId) {
        const phone = await WhatsappPhoneNumber.findOne({
            phone_number_id: metaPhoneNumberId,
            deleted_at: null
        }).populate('waba_id');

        if (!phone || !phone.waba_id || !phone.waba_id.access_token) {
            throw new Error(`Valid Phone Number or Access Token not found for phone_number_id: ${metaPhoneNumberId}`);
        }
        return phone.waba_id.access_token;
    }

    mapMetaCallingToSettings(metaCalling, storagePhoneId, userId) {
        const calling = metaCalling || {};
        return {
            phone_number_id: storagePhoneId,
            user_id: userId,
            calling_status: calling.status === 'ENABLED' ? 'ENABLED' : 'DISABLED',
            call_icon_visibility: calling.call_icon_visibility || 'DEFAULT',
            call_hours: calling.call_hours || { status: 'DISABLED' },
            sip_config: calling.sip
                ? { status: calling.sip.status || 'DISABLED', servers: calling.sip.servers || [] }
                : { status: 'DISABLED', servers: [] }
        };
    }

    async getCallConfigFromMeta(phone) {
        const accessToken = await this.getAccessTokenForPhone(phone.phone_number_id);
        const url = `${WHATSAPP_GRAPH_API_APP_URL}/${WHATSAPP_API_VERSION}/${phone.phone_number_id}/settings`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    }

    async sendCallEvent(metaPhoneNumberId, callId, event, session = null) {
        try {
            const accessToken = await this.getAccessTokenForPhone(metaPhoneNumberId);
            const url = `${WHATSAPP_GRAPH_API_APP_URL}/${WHATSAPP_API_VERSION}/${metaPhoneNumberId}/calls`;

            const payload = {
                messaging_product: 'whatsapp',
                call_id: callId,
                action: event
            };

            if (session) {
                payload.session = session;
            }

            const response = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error(`Error sending call event ${event}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async answerCall(phoneNumberId, callId, sdpOffer, agent, contact, callLog) {
        const sdpAnswer = await webrtcService.answerCall(callId, phoneNumberId, sdpOffer, agent, contact, callLog);

        await this.sendCallEvent(phoneNumberId, callId, 'PRE_ACCEPT', {
            sdp_type: 'answer',
            sdp: sdpAnswer
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        return this.sendCallEvent(phoneNumberId, callId, 'ACCEPT', {
            sdp_type: 'answer',
            sdp: sdpAnswer
        });
    }

    async connectOutboundCall(phoneNumberId, callId, sdpAnswer, agent, contact, callLog) {
        return webrtcService.connectOutboundCall(callId, sdpAnswer, agent, contact, callLog);
    }

    async terminateCall(phoneNumberId, callId) {
        return this.sendCallEvent(phoneNumberId, callId, 'terminate');
    }

    async updateCallConfig(phone, settings) {
        try {
            const accessToken = await this.getAccessTokenForPhone(phone.phone_number_id);
            const url = `${WHATSAPP_GRAPH_API_APP_URL}/${WHATSAPP_API_VERSION}/${phone.phone_number_id}/settings`;

            const callingConfig = {};
            if (settings.calling_status) callingConfig.status = settings.calling_status;
            if (settings.call_icon_visibility) callingConfig.call_icon_visibility = settings.call_icon_visibility;

            if (settings.call_hours && settings.call_hours.status === 'ENABLED') {
                callingConfig.call_hours = settings.call_hours;
            }

            if (settings.sip_config && settings.sip_config.status === 'ENABLED') {
                callingConfig.sip = settings.sip_config;
            }

            const payload = { calling: callingConfig };
            const response = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating call settings for ${phone.phone_number_id}:`, error.response?.data || error.message);
            throw error;
        }
    }
}

export default new WhatsappCallingService();
