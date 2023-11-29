import wixData from "wix-data";
import { query } from "wix-location";
import { local } from "wix-storage";
import { BRAND_COLOR_PRIMARY, CACHE_USER_CURRENCY } from "public/constant";
import { getCurrency } from "public/utils";

let type = "voice"; // sms

$w.onReady(async function () {
    $w("#btnUsageCalls").onClick(()=>{
        if( type === "voice" ) return;

        $w("#btnUsageCalls").style.backgroundColor = BRAND_COLOR_PRIMARY;
        $w("#btnUsageCalls").style.color = "#ffffff";
        $w("#btnUsageSms").style.backgroundColor = "rgba(0,0,0,0)";
        $w("#btnUsageSms").style.color = "#000000";
        type = "voice";
        updatePlansFilter();
    });

    $w("#btnUsageSms").onClick(()=>{
        if( type === "voice-message" ) return;

        $w("#btnUsageCalls").style.backgroundColor = "rgba(0,0,0,0)";
        $w("#btnUsageCalls").style.color = "#000000";
        $w("#btnUsageSms").style.backgroundColor = BRAND_COLOR_PRIMARY;
        $w("#btnUsageSms").style.color = "#ffffff";
        type = "voice-message";
        updatePlansFilter();
    });

    function updatePlansFilter() {
        $w("#dataset1").setFilter(wixData.filter().eq("type", type).ne("amount", 0));
    }

    const currency = await getCurrency();
    local.setItem(CACHE_USER_CURRENCY, currency);


    $w("#repeater2").onItemReady(($item, itemData)=>{
        if( currency === "USD" ) {
            $item("#textCurr").text = `$${itemData.amount}`;
        }
        else  if( currency === "AUD" ) {
            $item("#textCurr").text = `A$${itemData.amountAud}`;
        }
    });

    const isPlanHighlight = query["plan-highlight"];
    if( isPlanHighlight === "true" ) {
        $w("#sectionPlan").scrollTo();
    }
    // 
    $w("#dsTestimonials").onReady(async ()=>{
        /** @type {$w.dataset} */
        const $ds = $w("#dsTestimonials");
        const totalTestimonials = await $ds.getTotalCount();
        if( totalTestimonials > 0 ) {
            $w("#sectionTestimonials").expand();
        }
    })
});
