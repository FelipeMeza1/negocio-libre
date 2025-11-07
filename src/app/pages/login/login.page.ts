import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { IonicModule } from '@ionic/angular'; 
import { CommonModule } from '@angular/common'; 


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true, 
  imports: [
    IonicModule,         
    ReactiveFormsModule,  
    CommonModule       
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit() {}


  login() {
    if (this.loginForm.valid) {
      this.apiService.loginUsuario(this.loginForm.value).subscribe(
        (response: any) => {
          console.log('Login exitoso:', response);

          // --- ¡CAMBIO IMPORTANTE! ---
          // Guardamos el objeto 'usuario' completo en localStorage.
          // Esto permite que otras páginas (como el dashboard) 
          // sepan quién ha iniciado sesión.
          localStorage.setItem('usuario', JSON.stringify(response.usuario));
          // --------------------------

          alert('¡Bienvenido!');
          const userRole = response.usuario.rol;

          if (userRole === 1) {
            this.router.navigate(['/dashboard-usuario']);
          } else if (userRole === 2) {
            // --- ¡CAMBIO IMPORTANTE! ---
            // Redirigimos al nuevo panel de pestañas
            this.router.navigate(['/gestion-vendedor']);
          } else {
            this.router.navigate(['/inicio']);
          }

        },
        (error: any) => {
          console.error('Error en el login:', error);
          alert(error.error.msg || 'Credenciales incorrectas');
        }
      );
    }
  }
}