import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { GoogleMapsModule } from '@angular/google-maps';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard-usuario',
  templateUrl: './dashboard-usuario.page.html',
  styleUrls: ['./dashboard-usuario.page.scss'],
  standalone: true,
  imports: [
    IonicModule, 
    CommonModule, 
    FormsModule,
    GoogleMapsModule
  ]
})
export class DashboardUsuarioPage implements OnInit {
  
  mapaVisible: boolean = false;
  
  mapOptions: google.maps.MapOptions = {
    center: { lat: -33.45694, lng: -70.64827 }, // Santiago por defecto
    zoom: 12,
  };

  listaDePines: any[] = [];
  
  negocioSeleccionado: any = null; 
  productosNegocio: any[] = []; 
  isLoadingProducts = false; 
  
  constructor(
    private apiService: ApiService,
    private alertController: AlertController
  ) { }

  ngOnInit() {}

  ionViewWillEnter() {
    // Si el mapa ya estaba visible (ej: el usuario navegó de vuelta a esta página),
    // forzamos la recarga de los pines.
    if (this.mapaVisible) {
      console.log('Actualizando pines porque el mapa ya estaba visible.');
      this.cargarPinesDeLaAPI();
    }
    // Si el mapa no estaba visible, la función mostrarMapa() 
    // se encargará de llamar a cargarPinesDeLaAPI() cuando se presione el botón.
  }

  mostrarMapa() {
    this.mapaVisible = true;
    this.cargarPinesDeLaAPI();
    this.centrarEnUbicacionActual();
  }

  // --- FUNCIÓN PARA CENTRAR EN EL USUARIO (GEOLOCALIZACIÓN) ---
  centrarEnUbicacionActual() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const nuevaPosicion = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          this.mapOptions = {
            ...this.mapOptions,
            center: nuevaPosicion,
            zoom: 15,
          };
        },
        (error) => {
          console.warn('Error al obtener geolocalización:', error.message);
          this.mostrarAlertaSimple('Ubicación No Disponible', 'No pudimos obtener tu ubicación actual. El mapa se centrará en la ubicación por defecto.');
        }
      );
    }
  }

  // --- FUNCIÓN PARA CARGAR PINES DE LA API ---
  cargarPinesDeLaAPI() {
    this.apiService.getUbicacionesNegocios().subscribe(
      (negocios: any[]) => {
        this.listaDePines = negocios
          .filter(negocio => negocio.latitud && negocio.longitud && negocio.latitud !== 0 && negocio.longitud !== 0)
          .map(negocio => ({ 
            ...negocio,
            position: { lat: negocio.latitud, lng: negocio.longitud }
          }));

        if (this.listaDePines.length === 0) {
          this.mostrarAlertaSimple('Mapa Vacío', 'Aún no hay negocios con ubicaciones guardadas.');
        }
      },
      (error) => {
        console.error('Error al cargar pines desde la API:', error);
        this.mostrarAlertaSimple('Error', 'No se pudieron cargar las ubicaciones de los negocios.');
      }
    );
  }

  // --- FUNCIÓN PARA EL CLIC EN EL PIN ---
  onMarkerClick(negocio: any) {
    this.mapOptions = {
        ...this.mapOptions,
        center: negocio.position,
        zoom: 17
    };

    this.negocioSeleccionado = negocio;
    this.productosNegocio = []; 
    this.isLoadingProducts = true;
    
    // ----------------------------------------------------
    // ¡LA LÍNEA CORREGIDA! Usamos getProductosPorNegocio
    // ----------------------------------------------------
    this.apiService.getProductosPorNegocio(negocio.negocio_id).subscribe({
      next: (productos) => {
        this.productosNegocio = productos;
        this.isLoadingProducts = false;
      },
      error: (err) => {
        console.error('Error al cargar productos del negocio:', err);
        this.isLoadingProducts = false;
        this.mostrarAlertaSimple('Error', 'No se pudieron cargar los productos de este negocio.');
      }
    });
  }
  
  // --- FUNCIÓN PARA CERRAR LA TARJETA ---
  onMapClick() {
    if (this.negocioSeleccionado) {
        this.negocioSeleccionado = null;
        this.productosNegocio = [];
    }
  }

  // --- Lógica de CÁLCULO DE PRECIO ---
  calcularPrecioOferta(precio: number, descuento: number) {
    if (!descuento || descuento <= 0 || descuento > 100) {
      return precio; 
    }
    const precioFinal = precio - (precio * (descuento / 100));
    return Math.floor(precioFinal);
  }
  
  // --- FUNCIÓN PARA MOSTRAR ALERTAS ---
  async mostrarAlertaSimple(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }
}