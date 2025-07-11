import { Component } from '@angular/core';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PanelModule } from 'primeng/panel';
import { TextareaModule } from 'primeng/textarea';




@Component({
  selector: 'co-home',
  imports: [ScrollPanelModule, PanelModule, TextareaModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {


}
