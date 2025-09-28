import {saveChat} from "../db/queries";

export async function saveChatAPI(title: string) {
    console.log(title);
    const value = await saveChat({title: title});
    console.log(value);
}