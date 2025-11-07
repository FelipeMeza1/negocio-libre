import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-gestion-productos',
  templateUrl: './gestion-productos.page.html',
  styleUrls: ['./gestion-productos.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule 
  ]
})
export class GestionProductosPage implements OnInit {
  
  segmentoSeleccionado = 'mis_productos'; 
  productoForm: FormGroup;
  misProductos: any[] = [];
  negocioId: number | null = null;
  isLoading = true; 
  imagenPreview: string | undefined;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.productoForm = this.fb.group({
      nombre_producto: ['', Validators.required],
      precio_base: ['', [Validators.required, Validators.min(1)]],
      stock_disponible: ['', [Validators.required, Validators.min(0)]],
      unidad: ['Unidad', Validators.required],
      imagen_url: [''] 
    });
  }

  ngOnInit() {
    this.cargarDatosNegocio();
    if (this.negocioId) {
      this.cargarProductos();
    }
  }

  segmentoCambiado(event: any) {
    this.segmentoSeleccionado = event.detail.value;
    if (this.segmentoSeleccionado !== 'anadir_producto' && this.negocioId) {
      this.cargarProductos();
    }
  }

  cargarDatosNegocio() {
    const usuarioString = localStorage.getItem('usuario');
    if (usuarioString) {
      const usuario = JSON.parse(usuarioString);
      if (usuario.negocio) {
        this.negocioId = usuario.negocio.negocio_id;
      }
    }
  }

  async tomarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false, 
        resultType: CameraResultType.DataUrl, 
        source: CameraSource.Prompt 
      });
      this.imagenPreview = image.dataUrl;
      this.productoForm.patchValue({ imagen_url: '' });
    } catch (error) {
      console.error('Error al tomar foto', error);
      this.mostrarToast('No se pudo seleccionar la imagen.', 'danger');
    }
  }

  onUrlInput() {
    if (this.imagenPreview) {
      this.imagenPreview = undefined;
    }
  }

  agregarProducto() {
    if (this.productoForm.invalid || !this.negocioId) {
      this.mostrarToast('Por favor, completa todos los campos.', 'danger');
      return;
    }

    let imagenFinalParaEnviar: string | null = null;
    if (this.imagenPreview) {
      imagenFinalParaEnviar = this.imagenPreview;
    } else if (this.productoForm.value.imagen_url) {
      imagenFinalParaEnviar = this.productoForm.value.imagen_url;
    }

    const datosProducto = {
      ...this.productoForm.value, 
      imagen_url: imagenFinalParaEnviar, 
      negocio_id: this.negocioId
    };
    
    if (!datosProducto.imagen_url) {
        delete datosProducto.imagen_url;
    }

    this.apiService.agregarProducto(datosProducto).subscribe({
      next: (nuevoProducto) => {
        this.mostrarToast('Producto guardado con éxito', 'success');
        this.productoForm.reset({ unidad: 'Unidad', imagen_url: '' }); 
        this.imagenPreview = undefined; 
        this.cargarProductos(); 
        this.segmentoSeleccionado = 'mis_productos'; 
      },
      error: (err) => {
        console.error('Error al agregar producto:', err);
        this.mostrarToast('Error al guardar el producto.', 'danger');
      }
    });
  }

  cargarProductos() {
    if (!this.negocioId) return;
    this.isLoading = true;
    
    this.apiService.getProductosPorNegocio(this.negocioId).subscribe({
      next: (data: any[]) => {
        this.misProductos = data.map(p => ({
          ...p,
          porcentaje_descuento: p.porcentaje_descuento || 0 
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.mostrarToast('Error al cargar tus productos.', 'danger');
        this.isLoading = false;
      }
    });
  }

  async eliminarProducto(producto: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar "${producto.nombre_producto}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.apiService.eliminarProducto(producto.producto_id).subscribe({
              next: () => {
                this.mostrarToast('Producto eliminado.', 'success');
                this.misProductos = this.misProductos.filter(p => p.producto_id !== producto.producto_id);
              },
              error: (err) => this.mostrarToast('Error al eliminar.', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarModalEditar(producto: any) {
    const alert = await this.alertController.create({
      header: 'Editar Producto',
      inputs: [
        { name: 'nombre_producto', type: 'text', value: producto.nombre_producto, placeholder: 'Nombre' },
        { name: 'precio_base', type: 'number', value: producto.precio_base, placeholder: 'Precio' },
        { name: 'stock_disponible', type: 'number', value: producto.stock_disponible, placeholder: 'Stock' },
        { name: 'unidad', type: 'text', value: producto.unidad, placeholder: 'Unidad (ej: Kg)' },
        { name: 'imagen_url', type: 'text', value: producto.imagen_url || '', placeholder: 'URL de la imagen' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar Cambios',
          handler: (data) => {
            const datosActualizados = { ...producto, ...data };
            this.apiService.actualizarProducto(producto.producto_venta_id, datosActualizados).subscribe({
              next: (res) => {
                this.mostrarToast('Producto actualizado.', 'success');
                this.cargarProductos();
              },
              error: (err) => this.mostrarToast('Error al actualizar.', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  guardarOferta(producto: any) {
    const descuento = producto.porcentaje_descuento || 0;
    
    this.apiService.actualizarOferta(producto.producto_venta_id, { porcentaje_descuento: descuento }).subscribe({
      next: () => {
        this.mostrarToast('Oferta actualizada.', 'success');
      },
      error: (err) => this.mostrarToast('Error al guardar oferta.', 'danger')
    });
  }

  calcularPrecioOferta(precio: number, descuento: number) {
    if (!descuento || descuento <= 0 || descuento > 100) {
      return precio; 
    }
    const precioFinal = precio - (precio * (descuento / 100));
    return Math.floor(precioFinal);
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  esImagenValida(url: string | null): boolean {
    if (!url) {
      return false;
    }
    return url.startsWith('http') || url.startsWith('data:image');
  }

  // --- ¡ESTA ES LA FUNCIÓN QUE ARREGLA EL ERROR! ---
  // Esta función es llamada por el ion-range en el HTML
  formatearPin(value: number) {
    return `${value}%`;
  }
  // --- FIN DE LA FUNCIÓN ---
}