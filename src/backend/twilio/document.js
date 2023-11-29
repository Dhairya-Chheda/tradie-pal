import wixData from 'wix-data';
import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';
import { REGION_MAP_SERVICE } from "public/constant";
//@ts-ignore
import btoa from "btoa";


export class TwillioDocumentSync {
    
    constructor() {
        /** @type {string} */
        this.BASE_URL = "https://sync.twilio.com/v1";
        /** @type {typeof import('public/types-model').ModelMembership} */
        this._membership = null;
    }

    async init(membershipId) {
        const res = await wixData.query("Membership").eq("_id", membershipId).include("account", "plan", "ServiceNumber").descending("_createdDate").find({suppressAuth: true});
        if( res.length === 0 ) throw new Error("Failed to membership id!");
        this._membership = res.items[0];

        const region = this._membership.account.region;
        this.DOC_DEFAULT_URL = `${this.BASE_URL}/Services/${REGION_MAP_SERVICE[region]}/Documents`;

        return true;
    }

    /**
     * 
     * @param {typeof import('public/types-model').ModelMembership=} membershipChange - A parameter is passed if the user change the plan type from voice to voice-message
     * @returns 
     */
    async create(membershipChange) {
        if( !this._membership ) throw new Error("Init failed!");
        const { documentBody } = await this.getDocInfo(membershipChange);
        return this.fetchData(null, "POST", documentBody)
    }

    async update() {
        if( !this._membership ) throw new Error("Init failed!");
        const { documentName, documentBody } = await this.getDocInfo();
        return this.fetchData(documentName, "POST", documentBody)
    }

    async remove() {
        if( !this._membership ) throw new Error("Init failed!");
        const { documentName } = await this.getDocInfo();
        return this.fetchData(documentName, "DELETE")
    }

    // Private methods below ↓

    getDocUrl(name) {
        return [this.DOC_DEFAULT_URL, name].join("/")
    }

    async getDocInfo(membership = this._membership) {
        if( membership?.account?._id ) throw new Error("twilioDocSync: Require 'account' object");
        if( membership?.plan?._id ) throw new Error("twilioDocSync: Require 'plan' object");
        if( membership.plan.type === "voice-message" &&  membership?.ServiceNumber?.phone ) throw new Error("twilioDocSync: Require 'ServiceNumber' for voice-message");

        let account = membership.account;

        /**@type {string} */
        // @ts-ignore
        const agentId = account.agent;
        
        /**@type {import("public/types-model").ModelVoiceAgent} */
        const resAgent = await wixData.get("VoiceAgent", agentId, {suppressAuth: true}) 

        let documentName;
        if( membership.plan.type === "voice-message" ) {
            documentName = membership.ServiceNumber.phone
        }
        else {
            documentName = account.phone;
        }

        let Data ={
            name:account.fullName,
            region:account.region,
            tradieMobile: account.phone,
            agent:  resAgent.title,
            greeting: account.greeting,
            memberId:   account._owner,
            businessInformation: account.businessInfo,
            serviceNumber: documentName,
            spam: account.spam,
            customerPlan: membership.plan.titleTier,
            forwardingNumber: account.phone
        }

        let documentBody = `UniqueName=${documentName}&Data={${Object.entries(Data).map(([k,v])=>`${k}:${v}`).join(",")}}`

        return {
            documentName,
            documentBody
        }
    }

    async fetchData(name, method, body) {
        const fetchOpts = {
            method,
            body: body || null,
            headers: await this.getHeaders()
        }
        const url = this.getDocUrl(name);
        const res = await fetch(url, fetchOpts);
        return res.json()
    }

    async getHeaders() {
        const [SID, token] = await Promise.all([
            getSecret("TWILIO_ACCOUNT_SID"),
            getSecret("TWILIO_AUTH_TOKEN")
        ])

        const auth = btoa(SID + ":" + token);

        return {
            'Authorization': 'Basic ' + auth,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
}
