import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// --- PrimeNG Modules ---
// Each PrimeNG component is now imported as its own module.
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { AvatarModule } from 'primeng/avatar';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';

// Define a simple interface for our message structure
interface Message {
  author: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-chat',
  // highlight-start
  standalone: true, // This makes the component self-contained
  imports: [
    // Import necessary modules directly here
    CommonModule, // Still needed for [ngClass]
    FormsModule,  // Needed for [(ngModel)]
    ScrollPanelModule,
    AvatarModule,
    TextareaModule,
    ButtonModule
  ],
  // highlight-end
  templateUrl: './chat.html',
  styleUrl: './chat.scss' // Using .scss as defined in your angular.json
})
export class Chat implements OnInit {
  messages: Message[] = [];
  newMessage = '';

  ngOnInit() {
    // Start with a welcome message from the AI
    this.messages.push({
      author: 'ai',
      text: 'Hello! How can I assist you with the latest Angular features today?'
    });
  }

  sendMessage() {
    const userMessage = this.newMessage.trim();
    if (userMessage === '') {
      return;
    }

    // 1. Add the user's message to the chat
    this.messages.push({ author: 'user', text: userMessage });
    this.newMessage = ''; // Clear the input

    // 2. Simulate an AI response
    // In a real app, this is where you would call your AI service
    setTimeout(() => {
      this.messages.push({
        author: 'ai',
        text: `This is a simulated response to: "${userMessage}"`
      });
    }, 1000);
  }
}