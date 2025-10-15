import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistroClientePageRoutingModule } from './registro-cliente-routing.module';

import { RegistroClientePage } from './registro-cliente.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RegistroClientePageRoutingModule
  ],
  declarations: [RegistroClientePage]
})
export class RegistroClientePageModule {}
