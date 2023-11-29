import wixLocation from "wix-location";
import wixWindow from "wix-window";

import { BRAND_COLOR_ASCENT, BRAND_COLOR_PRIMARY, BRAND_PROFILE_IMAGE } from "public/constant";
import FetchData from "public/fetch";

let fetch = new FetchData();

const STATE_BOX_ID = /** @type {const} */ ({
	DASHBOARD: "DASHBOARD",
	USAGE: "USAGE",
	PLAN: "PLAN",
	SETTING: "SETTING"
});

/**@type {keyof STATE_BOX_ID} */
let CURRENT_PAGE = STATE_BOX_ID.DASHBOARD;


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


$w.onReady(()=>{
    renderPage( validPage(wixLocation.query.page) || "DASHBOARD");

    $w("#btnDashboard").onClick(()=>{
        wixWindow.lightbox.close(STATE_BOX_ID.DASHBOARD);
    });
    $w("#btnUsage").onClick(()=>{
        wixWindow.lightbox.close(STATE_BOX_ID.USAGE);
    });
    $w("#btnPayment").onClick(()=>{
        wixWindow.lightbox.close("PAYMENT");
    });
    $w("#btnChangePlan").onClick(()=>{
        wixWindow.lightbox.close(STATE_BOX_ID.PLAN);
    });
    $w("#btnSetting").onClick(()=>{
        wixWindow.lightbox.close(STATE_BOX_ID.SETTING);
    });
    $w("#btnLogout").onClick(()=>{
        wixWindow.lightbox.close(STATE_BOX_ID.LOGOUT);
    });

    renderSidebarUi();
})

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