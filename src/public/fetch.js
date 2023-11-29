// @ts-expect-error
import { format, intervalToDuration } from "date-fns";
import { SESSION_RESTORE_JSON, getServiceNumberFromMemsbership } from "./utils";
import wixData from "wix-data";
import { session } from "wix-storage-frontend";

const SESSION_KEY_FETCH_ACCOUNT = "FETCH_ACCOUNT";
const SESSION_KEY_FETCH_MEMBERSHIP = "FETCH_MEMBERSHIP";

class FetchData {
    constructor() {
        this._account = null;
        this._membership = null;

        /**@type {LastSixMonths[]} */
        this._lastSixMonths = [];

        /**@type {Record<string,CacheCount>} */
        this._cacheLogCount = {
            "0": {call: null, sms: null},
            "1": {call: null, sms: null},
            "2": {call: null, sms: null},
            "3": {call: null, sms: null},
            "4": {call: null, sms: null},
            "5": {call: null, sms: null},
        }

        const stored_fetch_account = SESSION_RESTORE_JSON(SESSION_KEY_FETCH_ACCOUNT);
        const stored_fetch_membership = SESSION_RESTORE_JSON(SESSION_KEY_FETCH_MEMBERSHIP);
        
        if( stored_fetch_account ) this._account = stored_fetch_account;
        if( stored_fetch_membership ) this._membership = stored_fetch_membership;
        
        this.init();
    }

    async init() {
        await this.getAccount();
        this.getMembership();
    }

    /**
     * @param {{resetCache: boolean}=} opts
     * @returns {Promise<ModelAccount>}
     */
    async getAccount(opts) {
        let resetCache = opts && opts.resetCache;

        if( this._account && !resetCache ) return this._account;
        const res = await wixData.query("Account").include("agent").find();
        this._account = res.length && res.items[0];
        session.setItem(SESSION_KEY_FETCH_ACCOUNT, JSON.stringify(this._account) );
        return this._account;
    }
    
    /**
     * @param {{resetCache: boolean}=} opts
     * @returns {Promise<ModelMembership>}
     */
    async getMembership(opts) {
        let resetCache = opts && opts.resetCache;
        if( this._membership && !resetCache ) return this._membership;
        const res = await wixData.query("Membership").include("ServiceNumber", "account", "plan").descending("_createdDate").find();
        this._membership = res.length ? res.items[0] : {};
        session.setItem(SESSION_KEY_FETCH_MEMBERSHIP, JSON.stringify(this._membership) );
        return this._membership;
    }

    /**
     * @return {Promise<string>}
     */
    async getServiceNumber() {
        const membership = await this.getMembership();
        return getServiceNumberFromMemsbership(membership);
    }


    /**
     * @returns {Promise<number>}
     */
    async countMembershipLeft() {
        const membership = await this.getMembership();
        if( !membership.active ) return 0;

        let today = new Date();
        const startDate = new Date(membership.membershipDate);

        const { months: currentIntervalMonths } = intervalToDuration({
            start: startDate,
            end: today
        });

        const nextSubscriptionDate = new Date(startDate);
        nextSubscriptionDate.setMonth(nextSubscriptionDate.getMonth() + currentIntervalMonths + 1);
        
        const { days: daysLeft } = intervalToDuration({
            start: nextSubscriptionDate,
            end: today
        });

        return daysLeft;
    }

    /**
     * @param {string} dateKeyIndex
     * @return {Promise<number>}
     */
    async countCallLogs(dateKeyIndex = "0") {
        if( typeof this._cacheLogCount[dateKeyIndex]?.call === "number" ) return this._cacheLogCount[dateKeyIndex].call;
        const {  start, end } = await this.getLastSixMonthIndex(dateKeyIndex);
        const account = await this.getAccount();
        const count = await wixData.query("CallLogs").eq("memberId", account._owner).between("_createdDate", start, end).count();
        
        if (this._cacheLogCount[dateKeyIndex].call === null ) {
            this._cacheLogCount[dateKeyIndex].call = count;
        }
        
        return count;
    }

    /**
     * @param {string} dateKeyIndex
     * @return {Promise<number>}
     */
    async countSmsLogs(dateKeyIndex = "0") {
        if( typeof this._cacheLogCount[dateKeyIndex]?.sms === "number" ) return this._cacheLogCount[dateKeyIndex].sms;
        const {  start, end } = await this.getLastSixMonthIndex(dateKeyIndex);
        const account = await this.getAccount();

        const count = await wixData.query("SmsLogs").eq("memberId1", account._owner).between("_createdDate", start, end).count();
        
        if (this._cacheLogCount[dateKeyIndex].sms === null ) {
            this._cacheLogCount[dateKeyIndex].sms = count;
        }
        return count;
    }

    /**
     * @param {string} key
     * @return {Promise<LastSixMonths>}
     */
    async getLastSixMonthIndex(key="0") {
        if(!/0|1|2|3|4|5/.test(key)) throw new Error("Invalid key must be from 0-5");
        const item = (await this.getLastSixMonth()).find(e=>e.key === key);
        return item;
    }

    /**
     * @return {Promise<LastSixMonths[]>}
     */
    async getLastSixMonth() {
        if( this._lastSixMonths.length > 0 ) return this._lastSixMonths;
        const membership = await this.getMembership();
        const date = new Date(membership.membershipDate);
    
        const tempDate = new Date(date);
        tempDate.setMonth(tempDate.getMonth() + 1);
        tempDate.setDate(tempDate.getDate() - 1);
        
        const dates = [];
        for( let i = 0; i<6; i++) {
            let end = new Date(tempDate);
            let start = new Date(tempDate);
            let formatStr = "";
            start.setMonth(start.getMonth() - 1);
            start.setDate(start.getDate() + 1);
    
            let startFormat = format(start, "do MMM");
            let endFormat = format(end, "do MMM yyyy");
            formatStr = `${startFormat} - ${endFormat}`
            dates.push({ start, end, format:formatStr, key: String(i) });
    
            tempDate.setMonth(tempDate.getMonth() - 1);
        }

        this._lastSixMonths  = dates;
        return dates;
    }


}

export default FetchData;


/**
 * @typedef {object} ModelBase
 * @property {string} _id
 * @property {string} _updatedDate
 * @property {string} _createdDate
 * @property {string} _owner
 */

/**
 * @typedef {Object} ModelAccountRaw
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} fullName
 * @property {"REGISTER"|"PAYMENT"|"USER_INFO"|"VOICE"|"GREETING"|"BUSINESS_INFO"|"SPAM"|"COMPLETED"} state
 * @property {string} phone
 * @property {ModelVoiceAgent} agent
 * @property {boolean} spam
 * @property {string} greeting
 * @property {string} businessInfo
 * @property {"USD" |"AUD"} currency
 * @property {boolean} phoneVerified
 * @property {boolean} onBoardingCompleted
 * @property {"US" |"AU"} region
 * @property {string} profile
 */

/**
 * @typedef {Object} ModelMembershipRaw
 * @property {ModelAccount} account
 * @property {boolean} active
 * @property {"USD" | "AUD"} currency
 * @property {ModelPlan} plan
 * @property {ModelSessionRaw} session
 * @property {string} membership
 * @property {string} twillioDocumentId
 * @property {ModelServiceNumber} ServiceNumber
 * @property {Date} membershipDate
 */

/**
 * @typedef {Object} ModelVoiceAgentRaw
 * @property {string} title
 * @property {string} default
 * @property {string} selected
 * @property {string} audio
 * @property {string} description
 */

/**
 * @typedef {Object} ModelPlanRaw
 * @property {string} title
 * @property {string} titleTier
 * @property {"voice" |"voice-message"} type
 * @property {"Silver" | "Gold" | "Platinum"} tier
 * @property {number} amount
 * @property {number} amountAud
 * @property {string} stripePlanId
 * @property {string} stripePlanIdTest
 * @property {"USD"|"AUD"} currency
 * @property {string} paymentLink
 * @property {string} description
 */

/**
 * @typedef {Object} ModelSessionRaw
 * @property {string} clientReferenceId
 * @property {ModelAccount} account
 * @property {string} stripeCheckoutId
 * @property {"PAYMENT_COMPLETED" | "WAITING_FOR_PAYMENT"} status
 * @property {ModelPlan} plan
 */

/**
 * @typedef {Object} ModelServiceNumberRaw
 * @property {ModelAccount} account
 * @property {ModelMembership} membership
 * @property {string} phone
 */

/**
 * @typedef {Object} ModelCallLogRaw
 * @property {string} fromNumber
 * @property {string} toNumber
 * @property {string} name
 * @property {string} callReason
 * @property {string[]} callTranscript
 * @property {string} memberId
 * @property {"spam" | "business" | "personal"} callType
 */

/**
 * @typedef {Object} ModelSmsLogsRaw
 * @property {number} conversationTime
 * @property {string} fromNumber
 * @property {string} toNumber
 * @property {string} name
 * @property {string} smsReason
 * @property {"spam" | "business" | "personal"} smsCategory
 * @property {string[]} smsTranscript
 * @property {string} memberId
 */

/**
 * @typedef {ModelBase & ModelAccountRaw} ModelAccount
 * @typedef {ModelBase & ModelMembershipRaw} ModelMembership
 * @typedef {ModelBase & ModelVoiceAgentRaw} ModelVoiceAgent
 * @typedef {ModelBase & ModelPlanRaw} ModelPlan
 * @typedef {ModelBase & ModelSessionRaw} ModelSession
 * @typedef {ModelBase & ModelServiceNumberRaw} ModelServiceNumber
 * @typedef {ModelBase & ModelCallLogRaw} ModelCallLog
 * @typedef {ModelBase & ModelSmsLogsRaw} ModelSmsLogs
 */

/**
 * @typedef {object} LastSixMonths
 * @property {Date} start - The start time.
 * @property {Date} end - The end time.
 * @property {string} format - The end time.
 * @property {string} key - The end time.
 */

/**
 * @typedef {object} CacheCount
 * @property {number?} call - The start time.
 * @property {number?} sms - The end time.
 */