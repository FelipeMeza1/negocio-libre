import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cliente, Clientes } from '../pages/interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  
  constructor(private httpclient: HttpClient) { }

  //obtenemos a todos los usuarios conductores que se registraron
  getCliente():Observable<Cliente>{
    return this.httpclient.get<Cliente>(`${environment.apiUrl}/usuarios`);
  }

  //buscamos al usuario por su  (deprecado)
  getClientePorEmail(codigo: any):Observable<Clientes>{
    return this.httpclient.get<Clientes>(`${environment.apiUrl}/usuarios/?email=${codigo}`);
  }

  estaLoggeado(){
    return sessionStorage.getItem('rut')!=null;
  }

  BuscarClientePorEmail(codi: any):Observable<Cliente>{
    return this.httpclient.get<Cliente>(`${environment.apiUrl}/usuarios/?email=${codi}`);
  }

  BuscarClientePorId(id:number):Observable<Clientes>{
    return this.httpclient.get<Clientes>(`${environment.apiUrl}/usuarios/?id=${id}`)
  }
}
