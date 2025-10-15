import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, Clientes } from '../pages/interfaces/interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Procesoregistro {
  
  constructor(private httpclient:HttpClient) { }

  CrearCliente(newCliente: Clientes): Observable<Clientes>{
    return this.httpclient.post<Cliente>(`${environment.apiUrl}/usuarios`, newCliente);
  }
}
