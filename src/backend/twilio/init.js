import twilio from "twilio";
import { getSecret } from 'wix-secrets-backend';
import { TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID } from "public/constant";

// US => Master key
export async function getClient() {
    const [
        $TWILIO_AUTH_TOKEN,
        $TWILIO_ACCOUNT_SID
    ] = await Promise.all([
        getSecret(TWILIO_AUTH_TOKEN),
        getSecret(TWILIO_ACCOUNT_SID),
    ]);
    
    return twilio($TWILIO_ACCOUNT_SID, $TWILIO_AUTH_TOKEN);
}
