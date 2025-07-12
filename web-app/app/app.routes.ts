import { Routes } from '@angular/router';
import { Home } from './pages/home/home'
import { Chat } from './pages/chat/chat'

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'chat', component: Chat}
 ];