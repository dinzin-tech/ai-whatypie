import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';
import { connectDB } from './models/index.js';
import Setting from './models/setting.model.js';

async function runDiagnostic() {
  try {
    await connectDB();
    const metaSettings = await Setting.findOne().lean();

    const appId = metaSettings?.app_id ? String(metaSettings.app_id).trim() : null;
    const appSecret = metaSettings?.app_secret ? String(metaSettings.app_secret).trim() : null;

    if (!appId || !appSecret) {
      console.log(JSON.stringify({
        appId: appId || 'missing',
        appIdLength: appId ? appId.length : 0,
        appSecretLength: appSecret ? appSecret.length : 0,
        authenticationSuccess: false,
        httpStatus: 400,
        metaError: 'Setting document in MongoDB is missing app_id or app_secret.'
      }, null, 2));
      await mongoose.connection.close();
      process.exit(0);
    }

    try {
      // Authenticate App ID + App Secret via Meta Client Credentials
      const tokenRes = await axios.get('https://graph.facebook.com/v22.0/oauth/access_token', {
        params: {
          client_id: appId,
          client_secret: appSecret,
          grant_type: 'client_credentials'
        }
      });

      const accessToken = tokenRes.data?.access_token;

      // Query App details to verify token validity
      const appRes = await axios.get(`https://graph.facebook.com/v22.0/${appId}`, {
        params: {
          access_token: accessToken,
          fields: 'id,name'
        }
      });

      console.log(JSON.stringify({
        appId: appId,
        appIdLength: appId.length,
        appSecretLength: appSecret.length,
        authenticationSuccess: true,
        httpStatus: tokenRes.status,
        metaAppName: appRes.data?.name || null,
        metaAppId: appRes.data?.id || null
      }, null, 2));

    } catch (apiErr) {
      const metaErrObj = apiErr.response?.data?.error || {};
      console.log(JSON.stringify({
        appId: appId,
        appIdLength: appId.length,
        appSecretLength: appSecret.length,
        authenticationSuccess: false,
        httpStatus: apiErr.response?.status || 500,
        metaError: metaErrObj.message || apiErr.message,
        metaErrorType: metaErrObj.type || null,
        metaErrorCode: metaErrObj.code || null,
        metaErrorSubcode: metaErrObj.error_subcode || null
      }, null, 2));
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Diagnostic Script Execution Error:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

runDiagnostic();
