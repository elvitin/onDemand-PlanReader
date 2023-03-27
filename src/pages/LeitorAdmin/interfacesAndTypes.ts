import { Range, WorkSheet } from 'xlsx';

type ObjOrUndefined<T> = T | undefined;
export type FileType = ObjOrUndefined<File>;
export type WorkSheetType = ObjOrUndefined<WorkSheet>;

export enum Actions {
	//Ações processo principal
	requestWorksheet = 0, //parent
	requestedWorksheet = 0, //children

	sendworkSheet = 1, //children
	worksheetReceived = 1,

	requestContent = 2,
	requestedContent = 2,

	sendContent = 3,
	contentReceived = 3,

	updateStatus = 15,

	notifyError = 30,
	receivedError = 30
	//Ações do processo filho
}

export interface worksheetInfo {
	worksheetBase: WorkSheet;
	worksheetRange: Range;
	readCounter: number;
}

export interface iWorkerMessage<T> {
	action: Actions;
	objectReference?: T;
}
