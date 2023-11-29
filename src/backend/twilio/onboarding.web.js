import {Permissions, webMethod} from "wix-web-module";
import { TwilioPhone } from "./phone";
import { TwillioDocumentSync } from "./document";
import { ModelMembership } from "public/types-model";
import wixData from "wix-data";

export const onBoardingCompleted = webMethod(Permissions.SiteMember, (membershipId) => handleOnBoardingCompleted(membershipId));

export async function handleOnBoardingCompleted(accountId) {
    const twilioPhone = new TwilioPhone();
    const documentSync = new TwillioDocumentSync();

    const resMembership = await wixData.query("Membership").eq("account", accountId).include("account", "plan").find({suppressAuth: true});
    
    if( resMembership.length === 0 ) throw new Error(`Failed to find the membership for account ${accountId}`)
    
    /**@type {typeof ModelMembership} */
    const membership = resMembership.items[0];

    const membershipId = membership._id;

    await Promise.all([
        twilioPhone.init(membershipId),
        documentSync.init(membershipId)
    ])

    if( resMembership.length === 0 ) throw new Error("Failed to get the membership id!");

    
    if( membership.plan.type === "voice-message" ) {
        const resServiceNumber = await twilioPhone.createPhone();
        membership.ServiceNumber = resServiceNumber._id;
    }

    const { sid } = await documentSync.create();
    membership.twillioDocumentId = sid;
    
    await wixData.update("Membership", membership, { suppressAuth: true });
    return true;
}
