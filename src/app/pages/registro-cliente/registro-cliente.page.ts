import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-registro-cliente',
  templateUrl: './registro-cliente.page.html',
  styleUrls: ['./registro-cliente.page.scss'],
})
export class RegistroClientePage implements OnInit {

  registroFormu: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.registroFormu = this.fb.group({
      rut: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(9)]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: ['', [Validators.required, Validators.minLength(3)]],
      numero: ['', [Validators.required, Validators.maxLength(9)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit() {
  }

  Registro() {
    if (this.registroFormu.valid) {
      console.log('Enviando formulariooo:', this.registroFormu.value);

      this.apiService.registrarCliente(this.registroFormu.value).subscribe(
        (response) => {
          console.log('Respuesta del server', response);

          alert('¡Usuario registrado con tremendo exitazo!');
        },
        (error) => {
          console.error('Error en el registro:', error);

          alert('Hubo un error al registrar el usuario :( .');
        }
      );
    } else {
      console.log('El formulario no es válido');
    }
  }
}