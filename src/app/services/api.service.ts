import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Utilizamos la IP que definiste, que apunta a tu backend
  private apiUrl = 'http://localhost:3000/api'; 

  constructor(private http: HttpClient) { }

  // ==========================================================
  // --- AUTENTICACIÓN Y REGISTRO ---
  // ==========================================================

  registrarCliente(datosCliente: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro-cliente`, datosCliente);
  }

  // --- ¡MÉTODO AÑADIDO! ---
  // Este método es nuevo y apunta al endpoint correcto para vendedores.
  registrarVendedor(datosVendedor: any): Observable<any> {
    // Asumimos que tu endpoint de backend es '/api/registro-vendedor'
    return this.http.post(`${this.apiUrl}/registro-vendedor`, datosVendedor);
  }
  // --- FIN DEL MÉTODO AÑADIDO ---

  loginUsuario(credenciales: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciales);
  }

  // ==========================================================
  // --- UBICACIÓN Y MAPA DE USUARIO ---
  // ==========================================================

  /**
   * 1. Guarda (actualiza) la latitud y longitud de un negocio.
   */
  guardarUbicacionNegocio(datos: { lat: number, lng: number, usuarioId: any }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/negocio/ubicacion`, datos);
  }

  /**
   * 2. Obtiene todos los negocios para mostrarlos como pines en el mapa del cliente.
   */
  getUbicacionesNegocios(): Observable<any> {
    // Este endpoint está definido en tu server.js como '/api/negocios'
    return this.http.get(`${this.apiUrl}/negocios`); 
  }

  /**
   * 3. Obtiene los productos de un negocio específico (para la tarjeta flotante del cliente).
   * (Este es el método que corrige el error de tipeo 'getProductosPorNegocioCliente').
   */
  getProductosPorNegocio(negocioId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/negocio/${negocioId}/productos`);
  }
  
  // ==========================================================
  // --- GESTIÓN DE PRODUCTOS (Vendedor) ---
  // ==========================================================

  /**
   * 4. Agrega un producto nuevo.
   */
  agregarProducto(datosProducto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/productos`, datosProducto);
  }

  /**
   * 5. Edita un producto existente (Actualiza ambas tablas).
   */
  actualizarProducto(productoVentaId: number, datosProducto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/productos/${productoVentaId}`, datosProducto);
  }

  /**
   * 6. Elimina un producto.
   */
  eliminarProducto(productoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/productos/${productoId}`);
  }

  /**
   * 7. Aplica o quita una oferta (actualiza el descuento).
   */
  actualizarOferta(productoVentaId: number, datosOferta: { porcentaje_descuento: number }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/oferta/${productoVentaId}`, datosOferta);
  }

}