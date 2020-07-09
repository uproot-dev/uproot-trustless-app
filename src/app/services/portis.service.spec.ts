import { TestBed } from '@angular/core/testing';

import { PortisService } from './portis.service';

describe('PortisService', () => {
  let service: PortisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
