import { Component } from '@angular/core';

interface Componente{
  name: string;
  icon: string;
  redirecTo: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {}

  componentes : Componente[]=[
    {
      name:'Inicio',
      icon:'home-outline',
      redirecTo:'/inicio'
    }
  ]
}
