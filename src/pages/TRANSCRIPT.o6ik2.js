import wixWindow from "wix-window";
import wixData from "wix-data";
import { v4 as uuid } from "uuid";

$w.onReady(async ()=>{
    const data = await wixWindow.lightbox.getContext();
    if( !data || !data.mode || !data.id ) {
        console.error("Failed to get the valid data from context")
        wixWindow.lightbox.close();
        return;
    }
    const { mode, id } = data;

    if( mode === "call" ) {
        const item = await wixData.get("CallLogs", id);
        $w("#repeater1").data = transriptItem(item.callTranscript);
    }
    else {
        const item = await wixData.get("SmsLogs", id);
        $w("#repeater1").data = transriptItem(item.smsTranscript);
    }

    $w("#repeater1").onItemReady(($item, itemData)=>{
        $item("#textTitle").text = itemData.title;
    })

});

function transriptItem(items = []) {
    return items.map(item=>({
        title: item,
        _id: uuid()
    }))
}
