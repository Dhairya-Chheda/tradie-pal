import {Permissions, webMethod} from "wix-web-module";
import { getClient } from "./init";

const OTP_VERIFICATION_SERVICE = "VA6c76003f3ca1c15e28c9525498bc1db1";

export const sendSMS = webMethod(Permissions.SiteMember, to => handleSendSMS(to));
export const veryifyCode = webMethod(Permissions.SiteMember, (to, code) => handleVeryifyCode(to, code));


// https://www.twilio.com/docs/verify/sms#additional-resources
async function handleSendSMS(to) {
    try {
        const client = await getClient();
        return await client.verify.v2
            .services(OTP_VERIFICATION_SERVICE)
            .verifications
            .create({to, channel: 'sms'})
    }
    catch(e) {
        console.log(`Failed to send SMS. phone: ${to}`)
        console.error(e);
        throw new Error(e);
    }
}

// https://www.twilio.com/docs/verify/api/verification-check
async function handleVeryifyCode(to, code) {
    try {
        const client = await getClient();
        return await client.verify.v2
            .services(OTP_VERIFICATION_SERVICE)
            .verificationChecks
            .create({to, code })
    }
    catch(e) {
        console.log(`Failed to verify SMS. phone: ${to}`)
        console.error(e);
        throw new Error(e);
    }
}   
