import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {ChatMessage} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//Move this to main process and use it alongside a new API called 'newChat'
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('');
}