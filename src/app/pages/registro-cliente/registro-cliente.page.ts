import { Component, OnInit } from '@angular/core';
import { MenuController, AlertController } from '@ionic/angular';
import { Procesoregistro } from 'src/app/servicios/procesoregistro';
import { Auth } from 'src/app/servicios/auth';
import { Router } from '@angular/router';
import { FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { Clientes } from '../interfaces/interfaces';

@Component({
  selector: 'app-registro-cliente',
  templateUrl: './registro-cliente.page.html',
  styleUrls: ['./registro-cliente.page.scss'],
  standalone: false,
})
export class RegistroClientePage implements OnInit {

  registroFormu: FormGroup;

  userdata: any;

  nuevoCli: Clientes={
    rut: 0,
    nombre: '',
    email: '',
    password: '',
    rol: 0
  }

  constructor(private menuController: MenuController,
              private alertController: AlertController,
              private procesoRegistro: Procesoregistro,
              private auth: Auth,
              private router: Router,
              private builder: FormBuilder) {
                this.registroFormu = this.builder.group({
                  'rut' : new FormControl("", [Validators.required, Validators.minLength(8), Validators.maxLength(9)]),
                  'nombre' : new FormControl("", [Validators.required, Validators.minLength(3)]),
                  'email' : new FormControl("", [Validators.required, Validators.minLength(9), Validators.email]),
                  'password' : new FormControl("", [Validators.required, Validators.minLength(8), Validators.maxLength(16)]),
                  'rol' : new FormControl("", [Validators.required, Validators.maxLength(1)])
                })
               }

  ngOnInit() {
  }

  Registro(){
    if(this.registroFormu.valid){
      this.auth.BuscarClientePorId(this.registroFormu.value.email).subscribe(resp=>{
        this.userdata = resp;
        if(this.userdata.length>0){
          this.registroFormu.reset();
          this.Duplicidad();
        }
        else{
          this.nuevoCli.rut = this.registroFormu.value.rut;
          this.nuevoCli.nombre = this.registroFormu.value.nombre;
          this.nuevoCli.email = this.registroFormu.value.email;
          this.nuevoCli.password = this.registroFormu.value.password;
          this.nuevoCli.rol = this.registroFormu.value.rol;
          this.procesoRegistro.CrearCliente(this.registroFormu.value).subscribe();
          this.registroFormu.reset();
          this.EnviarDatos();
          this.router.navigateByUrl("/inicio");
        }
      })
    }
  }

  async EnviarDatos(){
    console.log("Registrando Usuario");
    const alert = await this.alertController.create({
      header: 'Gracias' + ' ' + this.nuevoCli.nombre,
      message: 'Has sido registrado/a en la app',
      buttons: ['OK'],
    });
    await alert.present();
  }

  async Duplicidad(){
    const alert = await this.alertController.create({
      header: 'Perdone',
      message: 'Los datos proporcionados ya estan registrados',
      buttons: ['Ok'],
    });
    await alert.present();
  }

}
