import wixData from "wix-data";
import { query } from "wix-location";
import { local } from "wix-storage";
import { BRAND_COLOR_PRIMARY, CACHE_USER_CURRENCY } from "public/constant";
import { getCurrency } from "public/utils";

$w.onReady(async function () {
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
