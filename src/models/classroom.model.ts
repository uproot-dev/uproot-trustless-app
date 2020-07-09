export class Classroom {
	public startDate: Date;
	public finishDate: Date;
	public startDate_StringDate: string;
	public finishDate_StringDate: string;
	public startDate_String: string;
	public finishDate_String: string;
	dateStringOptions = { year: 'numeric', month: 'long', day: 'numeric' };
	public metadata = {
		ENSName: '',
		email: '',
		url: '',
		avatar: '',
		description: '',
		notice: '',
		keywords: new Array<string>(),
		skylink: '',
	};
	public funds = { DAI: 0, LINK: 0 };
	public classdata = {
		students: 0,
		validStudents: 0,
		fundsInvested: 0,
		investmentReturns: 0,
		courseBalance: 0,
	};
	public params = { compoundApplyPercentage: 50, aaveApplyPercentage: 50 };
	public configs = {
		oracleRandom: '',
		requestIdRandom: '',
		oraclePaymentRandom: 0,
		oracleTimestamp: '',
		requestIdTimestamp: '',
		oraclePaymentTimestamp: 0,
		linkToken: '',
		uniswapDAI: '',
		uniswapLINK: '',
		uniswapRouter: '',
		aaveProvider: '',
		aaveLendingPool: '',
		aaveLendingPoolCore: '',
		aTokenDAI: '',
	};
	public ENSHasNotice = false;
	public state = {
		isClassroomNotOpen: false,
		isClassroomOpen: false,
		isClassroomClosed: false,
		isClassroomActive: false,
		isCourseFinished: false,
	};

	constructor(
		public id: number,
		public title: string,
		public smartcontract: string,
		public startDateTimestamp: number,
		public finishDateTimestamp: number,
		public duration: number,
		public price: number,
		public minScore: number,
		public cutPrincipal: number,
		public cutPool: number,
		public openForApplication: Boolean,
		public courseEmpty: Boolean,
		public classroomActive: Boolean,
		public courseFinished: Boolean,
		public addressChallenge: string,
		public owner: string
	) {
		this.refreshInfo();
	}

	public setupInfo(
		id_: number,
		title_: string,
		smartcontract_: string,
		startDateTimestamp_: number,
		finishDateTimestamp_: number,
		duration_: number,
		price_: number,
		minScore_: number,
		cutPrincipal_: number,
		cutPool_: number,
		openForApplication_: Boolean,
		courseEmpty_: Boolean,
		classroomActive_: Boolean,
		courseFinished_: Boolean,
		addressChallenge_: string,
		owner_: string
	) {
		this.id = id_;
		this.title = title_;
		this.smartcontract = smartcontract_;
		this.startDateTimestamp = startDateTimestamp_;
		this.finishDateTimestamp = finishDateTimestamp_;
		this.duration = duration_;
		this.price = price_;
		this.minScore = minScore_;
		this.cutPrincipal = cutPrincipal_;
		this.cutPool = cutPool_;
		this.openForApplication = openForApplication_;
		this.courseEmpty = courseEmpty_;
		this.classroomActive = classroomActive_;
		this.courseFinished = courseFinished_;
		this.addressChallenge = addressChallenge_;
		this.owner = owner_;
		this.refreshInfo();
	}

	private refreshInfo() {
		this.startDate = new Date(this.startDateTimestamp * 1000);
		this.finishDate = new Date(this.finishDateTimestamp * 1000);
		this.startDate_StringDate = this.startDate.toLocaleDateString(
			'en-US',
			this.dateStringOptions
		);
		this.finishDate_StringDate = this.finishDate.toLocaleDateString(
			'en-US',
			this.dateStringOptions
		);
		this.startDate_String = this.startDate.toUTCString();
		this.finishDate_String = this.finishDate.toUTCString();
		this.updateState();
	}

	public updateState() {
		this.state.isClassroomNotOpen = false;
		this.state.isClassroomOpen = false;
		this.state.isClassroomClosed = false;
		this.state.isClassroomActive = false;
		this.state.isCourseFinished = false;
		switch (this.getState()) {
			case 0: {
				this.state.isClassroomNotOpen = true;
				break;
			}
			case 1: {
				this.state.isClassroomOpen = true;
				break;
			}
			case 2: {
				this.state.isClassroomClosed = true;
				break;
			}
			case 3: {
				this.state.isClassroomActive = true;
				break;
			}
			case 4: {
				this.state.isCourseFinished = true;
				break;
			}
		}
	}

	public getState(): number {
		if (this.courseFinished) return 4;
		if (this.classroomActive) return 3;
		if (!this.openForApplication && !this.courseEmpty) return 2;
		if (this.openForApplication) return 1;
		return 0;
	}
}
