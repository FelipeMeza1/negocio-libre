import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil-vendedor',
  templateUrl: './perfil-vendedor.page.html',
  styleUrls: ['./perfil-vendedor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PerfilVendedorPage implements OnInit {

  nombreUsuario: string = '';
  emailUsuario: string = '';
  nombreNegocio: string = '';

  constructor(
    private router: Router,
    private navCtrl: NavController // Usamos NavController para limpiar el historial al salir
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  // Carga los datos guardados en localStorage al iniciar sesión
  cargarDatosUsuario() {
    const usuarioString = localStorage.getItem('usuario');
    if (usuarioString) {
      const usuario = JSON.parse(usuarioString);
      this.nombreUsuario = usuario.nombre || 'Usuario';
      this.emailUsuario = usuario.email || 'Email no disponible';
      
      if (usuario.negocio) {
        this.nombreNegocio = usuario.negocio.nombre_negocio || 'Mi Negocio';
      }
    }
  }

  // Borra los datos del usuario y redirige a la página de inicio
  cerrarSesion() {
    localStorage.removeItem('usuario');
    // Usamos navigateRoot para limpiar el historial de navegación
    this.navCtrl.navigateRoot('/inicio', { animated: true, animationDirection: 'back' });
  }
}