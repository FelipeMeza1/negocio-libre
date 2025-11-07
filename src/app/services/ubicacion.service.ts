// src/app/services/ubicacion.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Una interfaz simple para guardar los datos
export interface Ubicacion {
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {

  // Esta es la "tabla" en memoria donde guardamos los pines
  private ubicacionesSubject = new BehaviorSubject<Ubicacion[]>([]);
  public ubicaciones$ = this.ubicacionesSubject.asObservable();

  constructor() { }

  // Función para que el vendedor "guarde" un pin
  agregarUbicacion(nuevaUbicacion: Ubicacion) {
    const listaActual = this.ubicacionesSubject.getValue();
    const nuevaLista = [...listaActual, nuevaUbicacion];
    this.ubicacionesSubject.next(nuevaLista);
    console.log('Servicio: Ubicación añadida. Total:', nuevaLista.length);
  }
}