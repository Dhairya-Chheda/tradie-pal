import { isMemberHaveActiveAccountById as isMemberHaveActiveAccountByIdBackend } from "backend/membership";
import {Permissions, webMethod} from "wix-web-module";

export const isMemberHaveActiveAccountById = webMethod(Permissions.SiteMember , accountId => handleIsMemberHaveActiveAccountById(accountId));

async function handleIsMemberHaveActiveAccountById(accountId) {
    return isMemberHaveActiveAccountByIdBackend(accountId)
}
