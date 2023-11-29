import wixLocation from "wix-location-frontend";
import wixWindow from "wix-window";
import wixData from "wix-data";
// @ts-expect-error
import { format } from "date-fns";
import { authentication } from 'wix-members-frontend';
import { BRAND_COLOR_ASCENT, BRAND_COLOR_PRIMARY, BRAND_PROFILE_IMAGE } from "public/constant";
import { ONBOARDING_ERROR_OTP_INVALID, ONBOARDING_ERROR_OTP_MISMATCH, ONBOARDING_ERROR_OTP_NOT_SEND } from "public/constant";
import { sleep } from "public/utils";

import { sendSMS, veryifyCode } from "backend/twilio/sms.web";
import { createStripePortal, createStripePortalUpdateUrl, checkMembership } from "backend/stripe.web";
import FetchData from "public/fetch";
import { openLightbox } from "wix-window-frontend";

const STATE_BOX_ID = /** @type {const} */ ({
	DASHBOARD: "DASHBOARD",
	USAGE: "USAGE",
	PLAN: "PLAN",
	SETTING: "SETTING"
});

/**@type {keyof STATE_BOX_ID} */
let CURRENT_PAGE = "DASHBOARD";

const PAGE = /** @type {const} */ ({
    DASHBOARD: {
        $btn: $w("#btnDashboard"),
        icon: {
            active: getIcons("DASHBOARD", true),
            inactive: getIcons("DASHBOARD", false),
        }
    },
    USAGE: {
        $btn: $w("#btnUsage"),
        icon: {
            active: getIcons("USAGE", true),
            inactive: getIcons("USAGE", false),
        }
    },
    PLAN: {
        $btn: $w("#btnChangePlan"),
        icon: {
            active: getIcons("PLAN", true),
            inactive: getIcons("PLAN", false),
        }
    },
    SETTING: {
        $btn: $w("#btnSetting"),
        icon: {
            active: getIcons("SETTING", true),
            inactive: getIcons("SETTING", false),
        }
    },
});

let fetch = new FetchData();

$w.onReady(async function () {
    const account = await fetch.getAccount({ resetCache: true });
    console.log({ account })
    if( !account.onBoardingCompleted ) {
        wixLocation.to("/on-boarding");
    }
    
    initSidebar();
    initDashboard();
    initUsage();
    initSetting();
    initPlan();

    // Run on all page
    handleUpdateSubscription();
});

// #region sidebar
function initSidebar() {
    // Setup icon color
    renderPage( validPage(wixLocation.query.page) || "DASHBOARD");

    // dashboard button
    for( const [key, { $btn }] of Object.entries(PAGE) ) {
        $btn.onClick(()=>{
            //@ts-ignore
            renderPage(key);
        })
    }

    $w("#btnPayment").onClick(handlePaymentLink)

    $w("#btnLogout").onClick(handleLogOut);
    renderSidebarUi();

    $w("#btnSideBarM").onClick(async()=>{
        const action = await openLightbox("MOBILE_MENU", { currentPage: CURRENT_PAGE });
        if( action === "LOGOUT" ) handleLogOut();
        else if( action === "PAYMENT") handlePaymentLink();
        else  renderPage(action)
    });

    function handleLogOut(){
        authentication.logout()
        wixLocation.to("/")
    }

    async function handlePaymentLink() {
        const portal = await createStripePortal();
        wixLocation.to(portal.url)
    }
}

async function renderSidebarUi() {
    const account = await fetch.getAccount();
    $w('#imgSidebarProfile').src = account.profile || BRAND_PROFILE_IMAGE;
    $w("#textSidebarFullName").text = account.fullName;
    $w("#textSidebarPhone").text = account.phone;
}

/**
 * @param {keyof typeof STATE_BOX_ID} $CURR_PAGE 
 */
function renderPage($CURR_PAGE) {
    console.log("rendering....", $CURR_PAGE)
    CURRENT_PAGE = $CURR_PAGE
    const color = isActive => isActive ? BRAND_COLOR_PRIMARY  : BRAND_COLOR_ASCENT;

    
    for( const [key, { buttonId, icon, $btn }] of Object.entries(PAGE) ) {
        $btn.icon = icon.inactive;
        $btn.style.color = color(false);
        $btn.style.backgroundColor = "#ffffff";
    }

    PAGE[CURRENT_PAGE].$btn.icon = PAGE[CURRENT_PAGE].icon.active;
    PAGE[CURRENT_PAGE].$btn.style.color = color(true);
    PAGE[CURRENT_PAGE].$btn.style.backgroundColor = "#f7f0f1";


    $w("#multiStateBox1").changeState(CURRENT_PAGE);
    wixLocation.queryParams.add({ page: CURRENT_PAGE });
}

/**
 * @return {keyof typeof STATE_BOX_ID} $CURR_PAGE 
 */
function validPage($CURR_PAGE)  {
    if( Object.keys(PAGE).includes($CURR_PAGE) ) {
        return $CURR_PAGE;
    }
    return "DASHBOARD";
}

/**
 * 
 * @param {keyof typeof STATE_BOX_ID} page 
 * @param {boolean} isActive 
 */
function getIcons(page, isActive) {
    const color = isActive ? BRAND_COLOR_PRIMARY  : BRAND_COLOR_ASCENT;
    const ICON_PAGE = {
        DASHBOARD: `<svg width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.13041 8.57581V4.51718C8.13041 3.92521 7.67435 3.44522 7.1119 3.44522H4.27394C3.71148 3.44522 3.25543 3.92521 3.25543 4.51718V7.50385C3.25543 8.09606 3.71148 8.57581 4.27394 8.57581H8.13041ZM4.27394 1.30118H7.1119C8.79924 1.30118 10.1674 2.74091 10.1674 4.51706V9.64765C10.1674 10.2399 9.71136 10.7196 9.14891 10.7196H4.27394C2.58636 10.7196 1.21842 9.27988 1.21842 7.50373V4.51706C1.21842 2.74091 2.58636 1.30118 4.27394 1.30118ZM13.852 3.21588V8.57569H18.9445C19.5069 8.57569 19.963 8.09594 19.963 7.50373V3.21588C19.963 2.62391 19.5069 2.14392 18.9445 2.14392H14.8705C14.308 2.14392 13.852 2.62391 13.852 3.21588ZM18.9445 0C20.6321 0 22 1.43998 22 3.21588V7.50373C22 9.27988 20.6321 10.7196 18.9445 10.7196H12.8335C12.271 10.7196 11.8149 10.2399 11.8149 9.64765V3.21588C11.8149 1.43998 13.1829 0 14.8705 0H18.9445ZM13.852 14.4243V18.4887C13.852 19.0807 14.308 19.5607 14.8705 19.5607H17.7138C18.2763 19.5607 18.7323 19.0807 18.7323 18.4887V15.4963C18.7323 14.9041 18.2763 14.4243 17.7138 14.4243H13.852ZM17.7138 21.7045H14.8705C13.1829 21.7045 11.8149 20.2647 11.8149 18.4886V13.3522C11.8149 12.76 12.271 12.2803 12.8335 12.2803H17.7138C19.4012 12.2803 20.7694 13.72 20.7694 15.4961V18.4886C20.7694 20.2647 19.4012 21.7045 17.7138 21.7045ZM8.14804 14.4243H3.05552C2.49306 14.4243 2.03701 14.9041 2.03701 15.4963V19.7841C2.03701 20.3761 2.49306 20.8561 3.05552 20.8561H7.12954C7.69222 20.8561 8.14804 20.3761 8.14804 19.7841V14.4243ZM3.05552 23C1.36817 23 0 21.56 0 19.7841V15.4963C0 13.7201 1.36817 12.2804 3.05552 12.2804H9.16655C9.72923 12.2804 10.1851 12.7601 10.1851 13.3523V19.7841C10.1851 21.56 8.81711 23 7.12954 23H3.05552Z" fill="$color"/>
        </svg>
        `,
        USAGE: `<svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.2464 12.8931C16.8073 13.3218 16.5564 13.9386 16.6191 14.5972C16.7132 15.7263 17.7482 16.5522 18.8773 16.5522H20.8636V17.7963C20.8636 19.9604 19.0968 21.7272 16.9327 21.7272H4.93091C2.76682 21.7272 1 19.9604 1 17.7963V10.7604C1 8.59632 2.76682 6.8295 4.93091 6.8295H16.9327C19.0968 6.8295 20.8636 8.59632 20.8636 10.7604V12.2659H18.7518C18.1664 12.2659 17.6332 12.4959 17.2464 12.8931Z" stroke="$color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1 11.7012V6.92349C1 5.6794 1.76318 4.57122 2.92364 4.13213L11.2245 0.995765C11.5253 0.882425 11.8491 0.843761 12.1681 0.883094C12.4871 0.922427 12.7918 1.03858 13.056 1.22158C13.3202 1.40459 13.5361 1.64898 13.6851 1.93377C13.8341 2.21857 13.9117 2.53526 13.9114 2.85667V6.8294M5.70455 11.2726H13.0227M21.9708 13.3321V15.4858C21.9708 16.0608 21.5108 16.5312 20.9253 16.5521H18.8762C17.7471 16.5521 16.7121 15.7262 16.618 14.5971C16.5553 13.9385 16.8062 13.3217 17.2453 12.893C17.6321 12.4958 18.1653 12.2658 18.7508 12.2658H20.9253C21.5108 12.2867 21.9708 12.7571 21.9708 13.3321Z" stroke="$color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        `,
        SETTING: `<?xml version="1.0" encoding="UTF-8"?>
        <svg data-bbox="1 1.496 20.918 19.736" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" height="23" width="23" data-type="ugc">
            <g>
                <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="$color" d="M11.454 14.5a3.136 3.136 0 1 0 0-6.273 3.136 3.136 0 0 0 0 6.273Z" opacity="1" fill="none"/>
                <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="$color" d="M1 12.284v-1.84c0-1.088.889-1.987 1.986-1.987 1.893 0 2.666-1.338 1.715-2.98a1.985 1.985 0 0 1 .732-2.707L7.24 1.735c.826-.491 1.893-.199 2.384.627l.115.199c.94 1.641 2.488 1.641 3.44 0l.114-.199c.492-.826 1.558-1.118 2.384-.627l1.809 1.035a1.985 1.985 0 0 1 .732 2.708c-.952 1.641-.178 2.98 1.714 2.98 1.087 0 1.986.888 1.986 1.986v1.84a1.992 1.992 0 0 1-1.986 1.986c-1.892 0-2.666 1.338-1.714 2.98.543.95.22 2.163-.732 2.707l-1.809 1.035c-.826.491-1.892.199-2.384-.627l-.114-.199c-.941-1.641-2.489-1.641-3.44 0l-.115.199c-.491.826-1.558 1.119-2.384.627l-1.808-1.035A1.985 1.985 0 0 1 4.7 17.25c.951-1.642.178-2.98-1.715-2.98C1.89 14.27 1 13.37 1 12.284Z" opacity="1" fill="none"/>
            </g>
        </svg>
        `,
        PLAN: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 22C17.069 22 22 17.069 22 11C22 4.93103 17.069 0 11 0C4.93103 0 0 4.93103 0 11C0 17.069 4.93103 22 11 22ZM20.6453 11C20.6453 16.3103 16.3103 20.6453 11 20.6453C5.68966 20.6453 1.35468 16.3103 1.35468 11C1.35468 5.68966 5.68966 1.35468 11 1.35468C16.3103 1.35468 20.6453 5.68966 20.6453 11Z" fill="$color"/>
            <path d="M8.39903 18.2069C8.48031 18.234 8.56159 18.2611 8.64287 18.2611C8.91381 18.2611 9.18475 18.0986 9.26603 17.8276C9.40149 17.4754 9.21184 17.0961 8.85962 16.9606C5.71676 15.7685 4.11824 12.2463 5.28327 9.10349C5.85223 7.58625 6.99016 6.36703 8.45322 5.68969C9.94337 5.01235 11.5961 4.95817 13.1133 5.52713C14.7118 6.12319 15.9852 7.3424 16.6355 8.91383L14.7389 8.88674L17.367 13.6281L20.1577 8.99511L18.0985 8.96802C17.3941 6.80053 15.7685 5.09364 13.601 4.28083C11.7315 3.57639 9.69952 3.65767 7.91135 4.49758C6.09608 5.33748 4.7143 6.80053 4.03696 8.66999C2.57391 12.4631 4.55174 16.771 8.39903 18.2069Z" fill="$color"/>
        </svg>      
        `
    }

    return ICON_PAGE[page].replace(/\$color/g, color);
}
// #endregion sidebar
// #region DASHBOARD
const TEMPLATE_MEMBERSHIP_DATE_LEFT = "{count} days remaining";
const TEMPLATE_CALL_LOGS_DASHBOARD = "Total Calls : {count}/500";
const TEMPLATE_SMS_LOGS_DASHBOARD = "Total SMS Conversations : {count}/500";
async function initDashboard() {
    const membership = await fetch.getMembership();
    $w("#textDashbardPlanName").text = membership.active ? membership.plan.titleTier : "No plan active!";
    $w("#textDashboardNumber").text = await fetch.getServiceNumber() || "N/A";

    let left = await fetch.countMembershipLeft();
    let countCallLogs = await fetch.countCallLogs();
    let countSmsLogs = await fetch.countSmsLogs();
    $w("#textDashboardDayRemain").text = TEMPLATE_MEMBERSHIP_DATE_LEFT.replace("{count}", String(left));
    $w("#textDashboardCallLogCount").text = TEMPLATE_CALL_LOGS_DASHBOARD.replace("{count}", String(countCallLogs));
    $w("#textDashboardSMSLogCount").text = TEMPLATE_SMS_LOGS_DASHBOARD.replace("{count}", String(countSmsLogs));

    $w("#progressDashboardCallCount").value = countCallLogs;
    $w("#progressDashboardSMSCount").value = countSmsLogs;

    if( membership.plan.type === "voice"){
        $w("#textVoice").show();
    } else {
        $w("#textVoicemsg").show();
    }

    $w("#btnDashboardPlan").onClick(()=>{
        renderPage("PLAN");
    })

}
// #endregion DASHBOARD
// #region USAGE
const MODE_COLOR_PRIMARY = "#393D3B"; 
const MODE_COLOR_ASCENT = "#ffffff";

const TEMPLATE_TOTAL_LOGS = "Total {mode} :  {count}/500";
const TEMPLATE_CALL_LOGS = "Total Calls :  {count}/500";
const TEMPLATE_SMS_LOGS = "Total SMS Conversations :  {count}/500";

/** @type {"call" | "sms"} */
let mode = "call"; // "sms"

async function initUsage() {
    toggleUsageFilterButton($w("#btnUsageBusiness"), filterTableLogs);
    toggleUsageFilterButton($w("#btnUsagePersonal"), filterTableLogs);
    toggleUsageFilterButton($w("#btnUsageSpam"), filterTableLogs);

    $w("#dropUsageDates").onChange(filterLogs);

    $w("#btnUsageCalls").onClick(()=>{
        setUsageModeButton("call");
    });
    
    $w("#btnUsageSms").onClick(()=>{
        setUsageModeButton("sms");
    });

    $w("#dropUsageDates").options = (await fetch.getLastSixMonth()).map(item=>({
        label: item.format,
        value: item.key
    }));

    $w("#dropUsageDates").selectedIndex = 0;
    filterLogs();
}

/**
 * 
 * @param {"call" | "sms"} setMode 
 */
function setUsageModeButton(setMode) {
    if(!setMode) setMode = "call";
    if( setMode === mode ) return;

    mode = setMode;

    if( mode === "call" ) {
        $w("#btnUsageCalls").style.backgroundColor = MODE_COLOR_PRIMARY;
        $w("#btnUsageCalls").style.color = MODE_COLOR_ASCENT;

        $w("#btnUsageSms").style.backgroundColor = MODE_COLOR_ASCENT;
        $w("#btnUsageSms").style.color = MODE_COLOR_PRIMARY;
    }
    else {
        $w("#btnUsageCalls").style.backgroundColor = MODE_COLOR_ASCENT;
        $w("#btnUsageCalls").style.color = MODE_COLOR_PRIMARY;
        
        $w("#btnUsageSms").style.backgroundColor = MODE_COLOR_PRIMARY;
        $w("#btnUsageSms").style.color = MODE_COLOR_ASCENT;
    }


    filterLogs();
}


/**
 * 
 * @param {$w.Button} $btn 
 * @param {?()=>void} cb 
 */
function toggleUsageFilterButton($btn, cb) {
    $btn.collapseIcon();
    $btn.style.borderColor = BRAND_COLOR_ASCENT;
    $btn.style.color = BRAND_COLOR_ASCENT;

    $btn.onClick(()=>{
        if( $btn.iconCollapsed ) {
            $btn.expandIcon();
            $btn.style.borderColor = BRAND_COLOR_PRIMARY;
            $btn.style.color = BRAND_COLOR_PRIMARY;
        }
        else {
            $btn.collapseIcon();
            $btn.style.borderColor = BRAND_COLOR_ASCENT;
            $btn.style.color = BRAND_COLOR_ASCENT;
        }
        cb();
    });
}

async function filterLogs() {
    const dateKey = $w("#dropUsageDates").value;
    
    const [countCallLogs, countSmsLogs] = await Promise.all([
        fetch.countCallLogs(dateKey),
        fetch.countSmsLogs(dateKey),
    ])
    
    let currCount = mode === "call" ? countCallLogs : countSmsLogs;

    let templateTotalLogs = TEMPLATE_TOTAL_LOGS.replace("{mode}", mode === "call" ? "Calls" : "SMS");

    $w("#textUsageTotalLogs").text = templateTotalLogs.replace("{count}", String(currCount));
    $w("#progressUsageLogs").value = currCount;

    $w("#btnUsageCalls").label = TEMPLATE_CALL_LOGS.replace("{count}", String(countCallLogs));
    $w("#btnUsageSms").label = TEMPLATE_SMS_LOGS.replace("{count}", String(countSmsLogs));

    filterTableLogs();
    
    $w("#repeaterUsageData").onItemReady(($item, itemData)=>{ 
        $item("#textUsageRDate").text = itemData.date;
        $item("#textUsageRFrom").text = itemData.from;
        $item("#textUsageRName").text = itemData.name;
        $item("#textUsageRReason").text = itemData.reason;
        $item("#textUsageRCategory").text = itemData.category;

        $item("#textUsageRTranscript")[itemData?.transcript?.length ? "show": "hide"]();
        $item("#textUsageRTranscript").onClick(()=>{
            wixWindow.openLightbox("TRANSCRIPT", { mode, id: itemData._id})
        })
    })
}


async function filterTableLogs() {
    $w("#textUsageTableLoading").show();
    const database = mode === "call" ? "CallLogs" : "SmsLogs";
    const dateKey = $w("#dropUsageDates").value;
    const { start, end } = await fetch.getLastSixMonthIndex(dateKey);

    let category = [];

    if( !$w("#btnUsageBusiness").iconCollapsed ) category.push("business");
    if( !$w("#btnUsagePersonal").iconCollapsed ) category.push("personal");
    if( !$w("#btnUsageSpam").iconCollapsed ) category.push("spam");

    let query = await wixData.query(database).between("_createdDate", start, end);
    
    const fieldCatType = mode === "call" ? "callType" : "smsCategory";
    if(category.length > 0  ) query = query.hasSome(fieldCatType, category)

    const res = await query.find();

    if( res.length > 0 ) {
        $w("#boxUsageFilter").expand();
        $w("#boxUsageTable").expand();
    } else {
        $w("#boxUsageFilter").collapse();
        $w("#boxUsageTable").collapse();
    }
    $w("#textUsageTableLoading").hide();

    $w("#repeaterUsageData").data = normalizeTableData(res.items);
}

function normalizeTableData(items) {
    
    if( mode === "call" ) {
        return items.map(item=>({
            date: format(item._createdDate, "dd MMM hh:mm"),
            from : item.fromNumber,
            name: item.name,
            reason: item.callReason,
            category: item.callType || "N/A",
            transcript: item.callTranscript,
            _id: item._id
        }))
    }
    
    return items.map(item=>({
        date: item.conversationTime ? format(item.conversationTime, "dd MMM hh:mm") : "N/A",
        from : item.fromNumber,
        name: item.name,
        reason: item.smsReason,
        category: item.smsCategory || "N/A",
        transcript: item.smsTranscript,
        _id: item._id
    }));
}

// #endregion USAGE
// #region PLAN
function initPlan() {
    $w("#btnPlanUpgrade1").onClick(async ()=>{
        const url = await createStripePortalUpdateUrl();
        wixLocation.to(url)
    });
    $w("#btnPlanUpgrade2").onClick(async ()=>{
        const url = await createStripePortalUpdateUrl();
        wixLocation.to(url)
    });
    $w("#btnPlanCancel").onClick(async () => {
        const { url } = await createStripePortal();
        wixLocation.to(url);
    });


    $w('#repeaterPlanVoice').onItemReady(async ($item, itemData)=>{
        const isCurrentMembership = itemData._id === (await fetch.getMembership()).plan._id;
        $item("#textPlanLabel").text = isCurrentMembership ? "Current Plan :" : "Plan :"
    });
    $w('#repeaterPlanVoiceMsg').onItemReady(async ($item, itemData)=>{
        const isCurrentMembership = itemData._id === (await fetch.getMembership()).plan._id;
        $item("#textPlanLabelMsg").text = isCurrentMembership ? "Current Plan :" : "Plan :"
    });
}

async function handleUpdateSubscription() {
    const updateSubscriptions = wixLocation.query.update_subscription === "true";

    if( !updateSubscriptions ) return;
    
    wixLocation.queryParams.remove(["update_subscription"]);
    await checkMembership();
    // Refresh the website?
}
// #endregion PLAN
// #region SETTING
// #region setting-general
function initSetting() {
    initSettingGeneral();
    initSettingPhone();
    initSettingService();
}

function initSettingGeneral() {
    let canEdit = false;
    let stateToChange = {
        on() {
            if(canEdit) return;
            $w("#inSettingFirstName").enable();
            $w("#inSettingLastName").enable();
            $w("#btnSettingGeneralEdit").hide();
            $w("#boxSettingUploadPictureEdit").show();
            $w("#btnSettingPassword").expand();
            $w("#btnSettingGeneralSave").expand();
            $w("#btnSettingGeneralCancel").expand();
            console.log("can edit", canEdit)
            canEdit = true;
        },
        off() {
            if(!canEdit) return;
            $w("#inSettingFirstName").disable();
            $w("#inSettingLastName").disable();
            $w("#btnSettingGeneralEdit").show();
            $w("#boxSettingUploadPictureEdit").hide();
            $w("#btnSettingPassword").collapse();
            $w("#btnSettingGeneralSave").collapse();
            $w("#btnSettingGeneralCancel").collapse();
            // reset ui
            refreshSettingGeneralUI();
            canEdit = false;
        }
    }

    $w("#btnSettingGeneralEdit").onClick(stateToChange.on);
    $w("#btnSettingGeneralCancel").onClick(stateToChange.off);

    $w("#btnSettingGeneralSave").onClick(async () => {
        const account = await fetch.getAccount({ resetCache: true });
        $w("#textSettingGeneralError").hide();
        
        if( !$w("#inSettingFirstName").valid || !$w("#inSettingLastName").valid ) {
            $w("#inSettingFirstName").updateValidityIndication();
            $w("#inSettingLastName").updateValidityIndication();
            $w("#textSettingGeneralError").text = "Please check the field(s) and try again!";
            $w("#textSettingGeneralError").show();
            return;
        }
        
        account.firstName = $w("#inSettingFirstName").value;
        account.lastName = $w("#inSettingLastName").value;
        account.profile = $w("#imgSettingProfile").src; 

        await wixData.save("Account", account);
        stateToChange.off();
        // reset cache before re-rendering the ui
        await fetch.getAccount({ resetCache: true });
        refreshSettingGeneralUI();
    });

    $w("#btnSettingUploadProfile").onChange(async ()=>{
        try {
            
            if( !$w("#btnSettingUploadProfile").value ) return;
            $w("#btnSettingGeneralSave").disable();
            const files = await $w("#btnSettingUploadProfile").uploadFiles();

            $w("#imgSettingProfile").src = files[0].fileUrl;
            $w("#btnSettingUploadProfile").reset();
        }
        catch(e) {
            console.log("Error uploading files : ", e.message);
            $w("#btnSettingGeneralSave").enable();
        }
        finally {
            $w("#btnSettingGeneralSave").enable();
        }
    });

    $w("#btnSettingProfileDel").onClick(()=>{
        $w("#imgSettingProfile").src = BRAND_PROFILE_IMAGE;
    })

    refreshSettingGeneralUI();
}

async function refreshSettingGeneralUI() {
    const account = await fetch.getAccount();
    $w("#inSettingFirstName").value = account.firstName;
    $w("#inSettingLastName").value = account.lastName; 
    $w("#imgSettingProfile").src = account.profile || BRAND_PROFILE_IMAGE;
    renderSidebarUi();
}

// #endregion setting-general
// #region setting-phone
function initSettingPhone() {
    
    let canEdit = false;
    let stateToChange = {
        on() {
            if(canEdit) return;
            $w("#inSettingPhone").enable();
            $w("#inSettingPhoneOtp").enable();
            $w("#inSettingPhoneOtp").hide();
            
            $w("#btnSettingPhoneSave").expand();
            $w("#btnSettingPhoneSave").label = "Send OTP";
            $w("#btnSettingPhoneSave").enable();
            $w("#btnSettingPhoneResend").collapse();
            $w("#btnSettingPhoneCancel").expand();
            
            canEdit = true;
        },
        off() {
            if(!canEdit) return;
            $w("#inSettingPhone").disable();
            $w("#inSettingPhoneOtp").disable();
            $w("#inSettingPhoneOtp").hide();

            $w("#btnSettingPhoneSave").collapse();
            $w("#btnSettingPhoneResend").collapse();
            $w("#btnSettingPhoneCancel").collapse();
            // reset ui
            refreshSettingPhoneUI();
            canEdit = false;
        }
    }

    $w("#btnSettingPhoneEdit").onClick(stateToChange.on);
    $w("#btnSettingPhoneCancel").onClick(stateToChange.off);

    
    /**@type {"USER_INFO" | "VERIFY_OTP"} */
    let STATE = "USER_INFO"; // "VERIFY_OTP"

    $w("#btnSettingPhoneSave").onClick(async () => {
        const account = await fetch.getAccount({ resetCache: true });
        $w("#textSettingPhoneError").hide();

        $w("#btnSettingPhoneSave").disable();

        if( STATE === "USER_INFO" ) {
            if( !$w("#inSettingPhone").valid ) {
                $w("#inSettingPhone").updateValidityIndication();
                $w("#textSettingPhoneError").text = "Please enter a valid phone number!";
                $w("#textSettingPhoneError").show();
                return;
            }
    
            $w("#inSettingPhone").disable();

            STATE = "VERIFY_OTP";
            updateVerifyOtpState();
        }
        else if( STATE === "VERIFY_OTP" ) {
            if( !$w("#inSettingPhoneOtp").valid ) {
                showError(ONBOARDING_ERROR_OTP_INVALID);
                $w("#inSettingPhoneOtp").updateValidityIndication();
                $w("#btnSettingPhoneSave").enable();
                return;
            }
            
            const matched = await veryifyCode($w("#inSettingPhone").value, $w("#inSettingPhoneOtp").value);
    
            if( !matched || matched.status !== "approved" ) {
                showError(ONBOARDING_ERROR_OTP_MISMATCH);
                $w("#btnSettingPhoneSave").enable();
                return;
            }
            account.phoneVerified = true;
            account.phone = $w("#inSettingPhone").value;
            await wixData.save("Account", account);
            stateToChange.off();
            // reset cache before re-rendering the ui
            await fetch.getAccount({ resetCache: true });
            refreshSettingPhoneUI();
        }

    });

    $w("#inSettingPhoneOtp").onInput(()=>{
        if( $w("#inSettingPhoneOtp").valid ) {
            $w("#btnSettingPhoneSave").enable();
        } else {  
            $w("#btnSettingPhoneSave").disable();
        }
    });
    
    refreshSettingPhoneUI();

}

async function showError(message="Something went wrong!") {
	$w("#textSettingPhoneError").text = message;
	$w("#textSettingPhoneError").show();
	await sleep(5000);
	$w("#textSettingPhoneError").hide();
}


async function updateVerifyOtpState() {
	try {
		const codeSend = await sendSMS($w("#inSettingPhone").value);
		if( codeSend && codeSend.status !== "pending" ) throw new Error(codeSend);
		$w("#inSettingPhoneOtp").show();

		$w("#btnSettingPhoneSave").disable();
		$w("#btnSettingPhoneSave").label = "Verify OTP";
		
		$w("#btnSettingPhoneResend").expand();
		$w("#btnSettingPhoneResend").disable();

		startOtpTimer();
	}
	catch(e) {
		console.error(e);
		showError(ONBOARDING_ERROR_OTP_NOT_SEND);
	}
}

let intervalResendTimerId;
function startOtpTimer() {
	if(intervalResendTimerId) clearInterval(intervalResendTimerId);
	const TIMEOUT_IN_MS = 10 * 60 * 1000;
	const ALLOW_RESEND_OTP_AT = 0.1 * 60 * 1000;

	let now = new Date();
	let timeoutAt = new Date( now.getTime() + TIMEOUT_IN_MS);
	
	setTimeout(()=>{
		$w("#btnSettingPhoneResend").enable();
	}, ALLOW_RESEND_OTP_AT)

	intervalResendTimerId = setInterval(()=>{
  
	  now = new Date();
	  let diff = timeoutAt.getTime() - now.getTime();
	  if( diff <= 0 ) {
		clearInterval(intervalResendTimerId);
		return;
	  }
	  
	  const m = "0" + Math.floor(diff / (60 * 1000));
	  const s = "0" + Math.floor(diff / 1000 % 60);
	  const mm = m.slice(-2);
	  const ss = s.slice(-2);
	  $w("#btnSettingPhoneResend").label = `Resend ${mm}:${ss}`;
	}, 500)

}

async function refreshSettingPhoneUI() {
    const account = await fetch.getAccount();
    $w("#inSettingPhone").value = account.phone;
    renderSidebarUi();
}

// #endregion setting-phone
// #region setting-service

function initSettingService() {

    let canEdit = false;
    let stateToChange = {
        on() {
            if(canEdit) return;
            $w("#btnSettingAgent").show();
            $w("#textBoxSettingServiceGreeting").enable();
            $w("#textBoxSettingServiceBusinessInfo").enable();
            
            $w("#btnSettingServiceSave").expand();
            $w("#btnSettingServiceCancel").expand();
            
            canEdit = true;
        },
        off() {
            if(!canEdit) return;
            $w("#btnSettingAgent").hide();
            $w("#textBoxSettingServiceGreeting").disable();
            $w("#textBoxSettingServiceBusinessInfo").disable();

            $w("#btnSettingServiceSave").collapse();
            $w("#btnSettingServiceCancel").collapse();
            // reset ui
            refreshSettingServiceUI();
            canEdit = false;
        }
    }

    $w("#btnSettingServiceEdit").onClick(stateToChange.on);
    $w("#btnSettingServiceCancel").onClick(stateToChange.off);

    $w("#btnSettingServiceSave").onClick(async () => {
        const account = await fetch.getAccount({ resetCache: true });
        $w("#textSettingServiceError").hide();

        if( !$w("#textBoxSettingServiceGreeting").valid || !$w("#textBoxSettingServiceBusinessInfo").valid ) {
            $w("#textBoxSettingServiceGreeting").updateValidityIndication();
            $w("#textBoxSettingServiceBusinessInfo").updateValidityIndication();
            $w("#textSettingServiceError").text = "Please check the field(s) and try again!";
            $w("#textSettingServiceError").show();
            return;
        }
        
        account.greeting = $w("#textBoxSettingServiceGreeting").value;
        account.businessInfo = $w("#textBoxSettingServiceBusinessInfo").value;
        
        await wixData.save("Account", account);
        stateToChange.off();
        // reset cache before re-rendering the ui
        await fetch.getAccount({ resetCache: true });
        refreshSettingGeneralUI();
    });

    $w("#btnSettingAgent").onClick(async ()=>{
        const agentId = await wixWindow.openLightbox("CHOOSE_VOICE")
        if( !agentId ) return;
        const account = await fetch.getAccount();
        account.agent = agentId;
        await wixData.update("Account", account);
        await fetch.getAccount({ resetCache: true });
        refreshSettingServiceUI();
    });
    refreshSettingServiceUI();
    
}

async function refreshSettingServiceUI() {
    const account = await fetch.getAccount();
    $w("#textBoxSettingServiceGreeting").value = account.greeting;
    $w("#textBoxSettingServiceBusinessInfo").value = account.businessInfo;
    $w("#imgSettingServiceAgent").src = account.agent.selected;
    renderSidebarUi();
}

// #endregion setting-service
// #endregion SETTING