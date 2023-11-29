import wixData from "wix-data";
import { getClient } from "./init";

export class TwilioPhone {
    constructor() {

        /** @type {typeof import('public/types-model').ModelMembership} */
        this._membership = null;
    }

    async init(membershipId) {
        const res = await wixData.query("Membership").eq("_id", membershipId).include("account", "plan", "ServiceNumber").find({suppressAuth: true});
        if( res.length === 0 ) throw new Error("Failed to membership id!");
        this._membership = res.items[0];
        this._client = await getClient();
        return true;
    }

    async createPhone() {
        // https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource
        
        const fetchedPhoneNumber = await this.findAvailablePhoneNumber(); 
        const resPhoneNumber = await this._client
            .incomingPhoneNumbers
            .create({phoneNumber: fetchedPhoneNumber })
            
        const toInsert = {
            account: this._membership.account._id,
            membership: this._membership._id,
            phone: resPhoneNumber.phone_number,
            sid: resPhoneNumber.sid,
            raw: resPhoneNumber
        }
        const resServiceNumber = await wixData.insert("ServiceNumber", toInsert, { suppressAuth: true });

        return resServiceNumber;
    }

    async deletePhone() {
        if( !this._membership || !this._membership.ServiceNumber || !this._membership.ServiceNumber.sid ) throw new Error("Failed to get the serice number");
        const resPhoneNumber = await this._client.incomingPhoneNumbers(this._membership.ServiceNumber.sid).remove();
        const resServiceNumber = await wixData.remove("ServiceNumber", this._membership.ServiceNumber._id , { suppressAuth: true });
        return resServiceNumber;
    }

    async findAvailablePhoneNumber() {
        // https://www.twilio.com/docs/phone-numbers/api/availablephonenumber-mobile-resource
        const mobile = await this._client
            .availablePhoneNumbers(this._membership.account.region || "US")
            .mobile
            .list({limit: 1});

        const phone = mobile.available_phone_numbers[0];
        if( !phone || !phone.phone_number ) {
            throw new Error("Failed to find the phone number")
        }
        return phone.phone_number

    }


}
