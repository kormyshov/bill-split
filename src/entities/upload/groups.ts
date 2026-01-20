import { getCommand, getRequestOptions } from "./common.ts";


export const createGroup = (name: string) => {
    fetch(getCommand("groups/create"), getRequestOptions(name));
}

export const changeGroupName = (groupId: number, name: string, created_at: string, created_by: number) => {
    fetch(getCommand("groups/change_name"), getRequestOptions(
        JSON.stringify(
            {
                group_id: groupId,
                name: name,
                created_at: created_at,
                created_by: created_by
            }
        ))
    );
}

export const joinToGroup = (token: string) => {
    fetch(getCommand("groups/join"), getRequestOptions(token));
}

export const leaveGroup = (groupId: number) => {
    fetch(getCommand("groups/leave"), getRequestOptions(groupId));
}
