import { Component, OnInit } from '@angular/core';
import { Globals } from '../app.globals';
import { ModalService } from '../_modal';

@Component({
	selector: 'app-classroomInfo',
	templateUrl: './classroomInfo.component.html'
})
export class ClassroomInfoComponent implements OnInit {
	constructor(
		public globals: Globals,
		private modalService: ModalService,
	) {}

	async ngOnInit() {
	}

	openModal(id: string) {
		this.modalService.open(id);
	}
	closeModal(id: string) {
		this.modalService.close(id);
	}
}
