import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // 1. IMPORTA RouterLink

@Component({
  selector: 'app-registro-cliente',
  templateUrl: './registro-cliente.page.html',
  styleUrls: ['./registro-cliente.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule,
    CommonModule,
    RouterLink // 2. AÑADE RouterLink AQUÍ
  ]
})
export class RegistroClientePage implements OnInit {

  registroFormu: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router 
  ) {
    this.registroFormu = this.fb.group({
      rut: ['', [Validators.required, Validators.pattern('^[0-9]{7,8}[0-9kK]{1}$')]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9._%+-ñÑ]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')
      ]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit() {
  }

  onRutInput(event: any) {
    let value = event.target.value;
    if (!value) return;

    // 1. Limpia cualquier carácter que NO sea un número o la letra K
    let cleaned = value.replace(/[^0-9kK]/gi, '').toUpperCase();

    // 2. Si se ingresa una 'K', se asegura de que solo esté al final
    if (cleaned.includes('K') && cleaned.indexOf('K') !== cleaned.length - 1) {
      // Quita la K si no está al final
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }
    
    // 3. Re-asigna el valor limpio al input
    event.target.value = cleaned;
    
    // 4. Actualiza el valor en el formulario de Angular (sin disparar eventos)
    this.registroFormu.get('rut')?.patchValue(cleaned, { emitEvent: false });
  }

  Registro() {
    if (this.registroFormu.valid) {
      
      const datosCliente = {
        ...this.registroFormu.value,
        rol: 1 // Forzamos el rol 1 (Cliente)
      };

      console.log('Enviando formulario de Cliente:', datosCliente);
      this.apiService.registrarCliente(datosCliente).subscribe(
        (response: any) => {
          console.log('Respuesta del servidor:', response);
          alert('¡Usuario registrado con éxito!');
          this.router.navigate(['/inicio']);
        },
        (error: any) => {
          console.error('Error en el registro:', error);
          alert('Hubo un error al registrar el usuario.');
        }
      );
    } else {
      console.log('El formulario no es válido');
    }
  }
}