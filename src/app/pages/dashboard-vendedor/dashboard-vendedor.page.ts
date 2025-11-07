import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { GoogleMapsModule } from '@angular/google-maps';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service'; 

@Component({
  selector: 'app-dashboard-vendedor',
  templateUrl: './dashboard-vendedor.page.html',
  styleUrls: ['./dashboard-vendedor.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule, 
    GoogleMapsModule,
  ],
})
export class DashboardVendedorPage implements OnInit {
  
  // --- ¡NUEVAS VARIABLES! ---
  nombreNegocio: string = '';
  tipoNegocio: string = '';
  // -------------------------

  direccion = ''; 
  mapOptions: google.maps.MapOptions = {
    center: { lat: -33.45694, lng: -70.64827 },
    zoom: 14, 
  };
  markerPosition: google.maps.LatLngLiteral | undefined;
  private apiKey = environment.googleMapsApiKey;

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.cargarDatosNegocio();
  }

  /**
   * --- ¡NUEVA FUNCIÓN! ---
   * Lee los datos del usuario desde localStorage para mostrar el nombre
   * y tipo de negocio.
   */
  cargarDatosNegocio() {
    const usuarioString = localStorage.getItem('usuario');
    if (usuarioString) {
      const usuario = JSON.parse(usuarioString);
      if (usuario.negocio) {
        this.nombreNegocio = usuario.negocio.nombre_negocio || 'Mi Negocio';
        this.tipoNegocio = usuario.negocio.tipo_negocio || 'Tipo no definido';
      }
    }
  }

  // --- El resto de tus funciones (centrarEnUbicacionActual, buscarUbicacion, etc.)
  // se mantienen exactamente iguales que antes ---

  // ... (pega aquí el resto de tus funciones: centrarEnUbicacionActual, 
  //      buscarUbicacion, moverPinConClick, obtenerDireccionDesdeCoords, 
  //      confirmarGuardar, guardarUbicacionPermanente y mostrarAlertaSimple) ...

//--- (Asegúrate de copiar el resto de tus funciones aquí para que el archivo esté completo) ---

  /**
   * FUNCIÓN DE EJEMPLO (YA LA TIENES)
   * Pide permiso al navegador para obtener la ubicación del usuario.
   */
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
            zoom: 17,
          };
          this.markerPosition = nuevaPosicion;
          this.obtenerDireccionDesdeCoords(nuevaPosicion);
        },
        (error) => {
          console.warn('Error al obtener geolocalización:', error.message);
          this.mostrarAlertaSimple('Ubicación no disponible', 'No pudimos obtener tu ubicación actual. Asegúrate de darle permisos al navegador.');
        }
      );
    } else {
      this.mostrarAlertaSimple('Navegador no compatible', 'Tu navegador no soporta geolocalización.');
    }
  }

  async buscarUbicacion() {
    if (!this.direccion) {
      this.mostrarAlertaSimple('Atención', 'Por favor, ingresa una dirección.');
      return;
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      this.direccion
    )}&key=${this.apiKey}`;
    try {
      const respuesta: any = await firstValueFrom(this.http.get(url));
      if (respuesta.status === 'OK' && respuesta.results.length > 0) {
        const location = respuesta.results[0].geometry.location;
        this.markerPosition = location;
        this.mapOptions = { ...this.mapOptions, center: location, zoom: 17 };
      } else {
        this.mostrarAlertaSimple('Error', 'No se pudo encontrar la dirección. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error al llamar a la API de Geocoding:', error);
      this.mostrarAlertaSimple('Error', 'Hubo un error al buscar la ubicación.');
    }
  }

  async moverPinConClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const latLng = event.latLng.toJSON();
      this.markerPosition = latLng; 
      this.obtenerDireccionDesdeCoords(latLng);
    }
  }

  async obtenerDireccionDesdeCoords(latLng: google.maps.LatLngLiteral) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLng.lat},${latLng.lng}&key=${this.apiKey}`;
    try {
      const respuesta: any = await firstValueFrom(this.http.get(url));
      if (respuesta.status === 'OK' && respuesta.results.length > 0) {
        this.direccion = respuesta.results[0].formatted_address;
      } else {
        this.direccion = 'Ubicación seleccionada (dirección no encontrada)';
      }
    } catch (error) {
      console.error('Error al llamar a la API de Geocoding Inversa:', error);
      this.mostrarAlertaSimple('Error', 'No se pudo obtener la dirección para ese punto.');
      this.direccion = 'Error al obtener dirección';
    }
  }

  async confirmarGuardar() {
    if (!this.markerPosition) {
      await this.mostrarAlertaSimple('Atención', 'No hay ninguna ubicación seleccionada. Busca una dirección o haz clic en el mapa.');
      return;
    }
    const confirmAlert = await this.alertController.create({
      header: 'Confirmar Ubicación',
      message: '¿Estás seguro de que quieres guardar esta ubicación permanentemente?',
      buttons: [ { text: 'Cancelar', role: 'cancel' }, { text: 'Sí, Guardar', handler: () => this.guardarUbicacionPermanente() } ],
    });
    await confirmAlert.present();
  }

  private guardarUbicacionPermanente() {
    if (!this.markerPosition) return;
    const usuarioString = localStorage.getItem('usuario');
    if (!usuarioString) {
      this.mostrarAlertaSimple('Error de Sesión', 'No se pudo encontrar tu ID de usuario. Por favor, vuelve a iniciar sesión.');
      return;
    }
    const usuario = JSON.parse(usuarioString);
    const miUsuarioIdReal = usuario.id; 
    if (!miUsuarioIdReal) {
        this.mostrarAlertaSimple('Error de Sesión', 'Tu ID de usuario no es válido. Por favor, vuelve a iniciar sesión.');
        return;
    }
    const datos = {
      lat: this.markerPosition.lat,
      lng: this.markerPosition.lng,
      usuarioId: miUsuarioIdReal 
    };
    this.apiService.guardarUbicacionNegocio(datos).subscribe(
      (response) => {
        this.mostrarAlertaSimple('¡Éxito!', 'Ubicación guardada en la base de datos.');
        this.markerPosition = undefined;
        this.direccion = '';
      },
      (error) => {
        console.error('Error al guardar en el backend:', error);
        const errorMsg = error.error?.msg || 'No se pudo guardar la ubicación en el servidor.';
        this.mostrarAlertaSimple('Error', errorMsg);
      }
    );
  }

  async mostrarAlertaSimple(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }
}