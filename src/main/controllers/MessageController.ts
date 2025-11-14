import {inject, injectable} from "inversify";
import {CORETYPES} from "../../../packages/core/types/types";
import {MessageService} from "../../../packages/core/services/MessageService";
import {Message, NewMessage} from "../../../packages/core/dto";
import {IpcController, IpcHandler} from "../ipc/Decorators";

@injectable()
@IpcController("message")
export class MessageController {
    constructor(@inject(CORETYPES.MessageService) private messageService: MessageService) {
    }

    @IpcHandler("getByChat")
    public async getByChat(chatId: string): Promise<Message[]> {
        return this.messageService.getMessagesByChatId(chatId);
    }

    @IpcHandler("save")
    public async save(newMessage: NewMessage): Promise<Message> {
        return this.messageService.createMessage(newMessage);
    }

    @IpcHandler("update")
    public async update(id: string, updates: Partial<NewMessage>) {
        return this.messageService.updateMessage(id, updates);
    }

    @IpcHandler("update")
    public async delete(id: string) {
        return this.messageService.deleteMessage(id);
    }
}
