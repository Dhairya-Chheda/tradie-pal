import wixData from "wix-data";

const ARCHIVE_OLDER_THAN = 8; // archived logs older than 8 months

export async function archiveCallLogs() {
    helperDatabaseArchived("calls");
}
export async function archiveSmsLogs() {
    helperDatabaseArchived("sms");
}

const databaseId = {
    calls: {
        source: "CallLogs",
        archived: "CallLogsArchived"
    },
    sms: {
        source: "SmsLogs",
        archived: "SmsLogsArchived"
    },
}

async function helperDatabaseArchived(type) {
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    today.setMonth(today.getMonth() - ARCHIVE_OLDER_THAN);
    
    const resLogs = await wixData.query(databaseId[type].source).le("_createdDate", today.toISOString()).find();
    let toDeleteIds  = [];

    const items = resLogs.items;
    items.map(item=>{
        item._idArchived = item._id;
        item._createdDateArchived = item._createdDate;
        delete item._id;
        delete item._createdDate;
        delete item._updatedDate;
        delete item._owner;
        toDeleteIds.push(item._id);
        return item;
    });

    const archivedItems = await wixData.bulkInsert(databaseId[type].archived, items)
    await wixData.bulkRemove(databaseId[type].source, toDeleteIds);

    console.log(`Archived ${type} logs ${toDeleteIds.length} `)
}
