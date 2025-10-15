import { TestBed } from '@angular/core/testing';

import { Procesoregistro } from './procesoregistro';

describe('Procesoregistro', () => {
  let service: Procesoregistro;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Procesoregistro);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
