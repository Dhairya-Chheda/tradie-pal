import wixData from 'wix-data';
import wixWindow from 'wix-window';
import wixLocation, { query } from "wix-location";
import { checkAndUpdateStripeSession } from "backend/stripe.web";

import { sleep } from "public/utils";

$w.onReady(async function () {
    try {
        
        if( query.client_reference_id ) {
            const sessionUpdated = await checkAndUpdateStripeSession(query.client_reference_id);
            console.log({ sessionUpdated });
            await sleep(5000);
            wixLocation.to("/on-boarding")
        }
    }
    catch(e) {
        console.error(e);
        wixWindow.openLightbox("ERROR");
        await sleep(5000);
    }
});
