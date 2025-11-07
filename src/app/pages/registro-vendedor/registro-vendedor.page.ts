import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { IonicModule } from '@ionic/angular'; // <-- ¡ESTA ES LA LÍNEA CORREGIDA!
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-vendedor',
  templateUrl: './registro-vendedor.page.html',
  styleUrls: ['./registro-vendedor.page.scss'],
  standalone: true, // ¡Importante!
  imports: [
    IonicModule,
    ReactiveFormsModule,
    CommonModule
  ]
})
export class RegistroVendedorPage implements OnInit {

  registroVendedorForm: FormGroup;

  tiposDeNegocio = [
    { id: 1, nombre: 'Verdulería' },
    { id: 2, nombre: 'Panadería' },
    { id: 3, nombre: 'Carnicería' },
    { id: 4, nombre: 'Almacén' },
    { id: 5, nombre: 'Botillería' },
    { id: 6, nombre: 'Farmacia' },
    { id: 7, nombre: 'Ferretería' },
    { id: 8, nombre: 'Restaurante' },
    { id: 9, nombre: 'Heladeria' },
    { id: 10, nombre: 'Mascotas' },
    { id: 'otro', nombre: 'Otro' } // Usamos 'otro' como ID especial
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.registroVendedorForm = this.fb.group({
      rut: ['', [Validators.required, Validators.pattern('^[0-9]{7,8}[0-9kK]{1}$')]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9._%+-ñÑ]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')
      ]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      nombre_negocio: ['', [Validators.required, Validators.minLength(3)]],
      tipo_negocio_id: [null, [Validators.required]],
      otro_tipo_negocio: [''] 
    });

    // --- ¡CAMBIOS AQUÍ! ---
    // Usamos f['...'] en lugar de f....
    // Cuando el 'tipo_negocio_id' cambia...
    this.f['tipo_negocio_id'].valueChanges.subscribe(value => {
      const otroControl = this.f['otro_tipo_negocio'];
      if (value === 'otro') {
        otroControl.setValidators([Validators.required, Validators.minLength(3)]);
      } else {
        otroControl.clearValidators();
      }
      otroControl.updateValueAndValidity(); 
    });
    // --- FIN DEL CAMBIO ---
  }

  // Helper para acceder fácilmente a los campos del formulario en el HTML
  get f() {
    return this.registroVendedorForm.controls;
  }

  ngOnInit() {
  }
  
  onRutInput(event: any) {
    let value = event.target.value;
    if (!value) return;

    let cleaned = value.replace(/[^0-9kK]/gi, '').toUpperCase();

    if (cleaned.includes('K') && cleaned.indexOf('K') !== cleaned.length - 1) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }
    
    event.target.value = cleaned;
    
    // --- ¡CAMBIO AQUÍ! ---
    // Usamos f['...'] en lugar de f....
    this.f['rut'].patchValue(cleaned, { emitEvent: false });
    // --- FIN DEL CAMBIO ---
  }

  registrarVendedor() {
    if (this.registroVendedorForm.valid) {
      const datosVendedor = {
        ...this.registroVendedorForm.value,
        rol: 2 // Forzamos el rol 2 (Vendedor)
      };

      console.log('Enviando formulario de Vendedor:', datosVendedor);

      // --- ¡CAMBIO IMPORTANTE! ---
      // Ahora llamamos al nuevo método 'registrarVendedor'
      this.apiService.registrarVendedor(datosVendedor).subscribe(
        (response: any) => {
          console.log('Respuesta del servidor (Vendedor):', response);
          alert('¡Cuenta de Negocio registrada con éxito! Ahora puedes iniciar sesión.');
          this.router.navigate(['/login']);
        },
        (error: any) => {
          console.error('Error en el registro de Vendedor:', error);
          alert(error.error?.msg || 'Hubo un error al registrar tu cuenta de negocio.');
        }
      );
    } else {
      console.log('El formulario de vendedor no es válido');
      // Marca todos los campos como "tocados" para mostrar los mensajes de error
      this.registroVendedorForm.markAllAsTouched();
    }
  }
}