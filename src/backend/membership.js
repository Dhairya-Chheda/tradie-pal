import wixData from "wix-data";
import { TwillioDocumentSync } from "./twillio/document";
import { TwilioPhone } from "./twillio/phone";

export async function isMemberHaveActiveAccountById(accountId) {
    const activeCount = await wixData.query("Membership").eq("account", accountId ).eq("active", true).count({ suppressAuth: true });
    return activeCount === 1;
}

// export async function isMemberHaveActiveAccount(email) {
//     const activeCount = await wixData.query("Membership").eq("title", email ).eq("active", true).count();
//     return activeCount === 1;
// }

export async function hookBeforeInsertMembership(item, context) {
    if( item.account ) {
        let account;
        if( typeof item.account === "string" ) {
            account = await wixData.get("Account", item.account);
        }
        item.title = account.email;
    }

    return item;
}

/**
 * @param {import("public/types-model").ModelMembership} item 
 * @param {*} context 
 */
export async function hookBeforeUpdateMembership(item, context) {
    /** @type {import("public/types-model").WixDataQueryResponse<import("public/types-model").ModelMembership>} */
    const resOldMembership = await wixData.query("Membership").eq("_id", item._id).include("account", "plan").find({suppressAuth: true});
    const oldMembership = resOldMembership.items[0];
    // No changes for users that is already non active or have not yet completed onBoarding.
    if( !oldMembership.active && !oldMembership.account.onBoardingCompleted) return item;

    const membershipId = item._id;

    const twilioDocSync = new TwillioDocumentSync();
    const twilioPhone = new TwilioPhone();
    await Promise.all([
        twilioDocSync.init(membershipId),
        twilioPhone.init(membershipId)
    ]);

    // Membership has been cancelled. Remove document and Service number if the user have it
    if( !item.active ) {
        await Promise.all([
            twilioDocSync.remove(),
            twilioPhone.deletePhone()
        ]);
        
        delete item.twillioDocumentId;
        return item;
    }

    // Check for plan type change
    const newPlanId = typeof item.plan === "string" ? item.plan : item.plan._id;
    const newPlan = await wixData.get("PaymentPlans", newPlanId);

    if( newPlan.type === oldMembership.plan.type  ) return item;
    
    if( newPlan.type === "voice") {
        // plan downgrade
        await Promise.all([
            twilioDocSync.remove(),
            twilioPhone.deletePhone()
        ]);
        
        delete item.twillioDocumentId;

        const { sid } = await twilioDocSync.create({ ...item, plan: newPlan, account: oldMembership.account})
        item.twillioDocumentId = sid;
    }
    else {
        // plan upgrade
        await twilioDocSync.remove()
        const ServiceNumber = await twilioPhone.createPhone();
        const { sid } = await twilioDocSync.create({ ...item, plan: newPlan, account: oldMembership.account, ServiceNumber})
        item.twillioDocumentId = sid;
    }

    return item
}
