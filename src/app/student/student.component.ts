import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { ModalService } from '../_modal';
import { Globals } from '../app.globals';

import { PortisService } from '../services/portis.service';
import { InfuraService } from '../services/infura.service';
import { ENSService } from '../services/ens.service';
import { environment } from 'src/environments/environment';
import { Student } from 'src/models/student.model';

@Component({
	selector: 'app-student',
	templateUrl: './student.component.html',
	styleUrls: ['./student.component.css'],
})
export class StudentComponent implements OnInit {
	focus;
	focus1;

	public mode = 'unconnected';
	public form: FormGroup;
	public txMode = 'off';
	public hashTx: any;

	constructor(
		public globals: Globals,
		private modalService: ModalService,
		public portisService: PortisService
	) { }

	async ngOnInit() {
		if (!this.globals.service) {
			this.globals.service = new InfuraService();
			await this.globals.ensService.configureProvider(
				this.globals.service.provider,
				false
			);
			console.log('Connected to infura');
		}
		this.globals.service.connectStudent().then(
			() => this.refreshAccountInfo(),
			(err) => {
				return console.log(err);
			}
		);
	}

	openModal(id: string) {
		this.modalService.open(id);
	}

	closeModal(id: string) {
		this.modalService.close(id);
	}

	txOn() {
		this.txMode = 'preTX';
	}

	txOff() {
		this.txMode = 'off';
	}

	refreshAccountInfo() {
		this.refreshStudentData();
		this.globals.service.getStudentName().then((val) => {
			this.globals.selectedStudent.name = val;
			this.refreshStudentMetadata();
		});
	}

	refreshStudentData() {
		if (!this.globals.selectedStudent)
			this.globals.selectedStudent = new Student(this.globals, this.globals.ADDR0);
		this.globals.service.getAddress().then((val) => {
			this.globals.selectedStudent.address = val;
		});
		this.globals.service.getStudentSmartContract().then((val) => {
			this.globals.selectedStudent.smartContractAddress = val;
		});
		this.globals.service.getScore().then((val) => {
			this.globals.selectedStudent.score = val;
		});
		this.globals.selectedStudent.updateApplications().then((val) => {
			this.globals.selectedStudent.hasApplications =
				this.globals.selectedStudent.applications.length > 0;
		});
	}

	async refreshStudentMetadata(student: Student = this.globals.selectedStudent) {
		const normalName = student.name.toLowerCase().replace(/\s/g, '');
		const node = this.globals.ensService.getSubNode(normalName);
		const record = await this.globals.ensService.hasRecord(node);
		if (!record) return;
		student.studentENSNameRecord = true;
		student.metadata.ENSName =
			normalName +
			'.' +
			this.globals.ensService.name +
			this.globals.ensService.domain;
		student.metadata.email = await this.globals.ensService.getTxEmail(
			node
		);
		student.metadata.url = await this.globals.ensService.getTxURL(node);
		student.metadata.avatar = await this.globals.ensService.getTxAvatar(
			node
		);
		student.metadata.description = await this.globals.ensService.getTxDescription(
			node
		);
		student.metadata.notice = await this.globals.ensService.getTxNotice(
			node
		);

		student.metadata.keywords = await this.globals.ensService.getTxKeywordsArray(
			node
		);
	}

	async updateName(newName: string): Promise<any> {
		this.txOn();
		if (newName == '') {
			this.txMode = 'failedTX';
		} else {
			this.txMode = 'processingTX';
			const updateName = await this.globals.service.studentUpdateName(
				newName
			)
			if (updateName == null) {
				this.txMode = 'failedTX';
			} else {
				this.hashTx = updateName.hash;
				this.txMode = 'successTX';
			}
		}
	}

	async registerStudentENS(): Promise<any> {
		this.txOn();
		this.txMode = 'processingTX';
		const normalName = this.globals.selectedStudent.name
			.toLowerCase()
			.replace(/\s/g, '');
		const node = this.globals.ensService.getSubNode(normalName);
		const hasRecord = await this.globals.ensService.hasRecord(node);
		if (!hasRecord)
			await this.studentClaimSubnode(
				normalName,
				this.globals.address,
				this.globals.selectedStudent.smartContractAddress
			);
		const nodeAddress = await this.globals.ensService.lookupNodeAddress(
			node
		);
		if (nodeAddress === this.globals.ADDR0)
			await this.globals.ensService.setAddr(
				node,
				this.globals.selectedStudent.smartContractAddress
			);
		this.txMode = 'successTX';
	}

	async studentClaimSubnode(label, owner, student) {
		const node = this.globals.ensService.node;
		const normalName = label.toLowerCase().replace(/\s/g, '');
		await this.globals.service.claimSubnodeStudent(
			node,
			normalName,
			owner,
			student
		);
	}

	async setMetadataRecord(type: string, text: string) {
		const normalName = this.globals.selectedStudent.name
			.toLowerCase()
			.replace(/\s/g, '');
		const node = this.globals.ensService.getSubNode(normalName);
		await this.globals.ensService.setTxRecord(type, text, node);
	}

	async updateENSNotice(text: string) {
		await this.globals.service.setTxRecord(
			this.globals.ensService.node,
			'notice',
			text
		);
		await this.refreshAccountInfo();
	}

	async updateENSDescription(text: string) {
		await this.globals.service.setTxRecord(
			this.globals.ensService.node,
			'description',
			text
		);
		await this.refreshAccountInfo();
	}
}
