import { UpdateOptions } from 'react-toastify';
import { Range, read, utils, WorkBook, WorkSheet } from 'xlsx';
import { Actions, FileType, iWorkerMessage, worksheetInfo } from './interfacesAndTypes';
import { childPostMessage } from './workerMiddleware';

self.addEventListener('message', async (e: MessageEvent<any>): Promise<void> => {
	try {
		const { action }: iWorkerMessage<any> = e.data;

		if (action === Actions.requestedWorksheet) {
			const { objectReference }: iWorkerMessage<FileType> = e.data;
			if (objectReference !== undefined) {
				childPostMessage<UpdateOptions>(postMessage.bind(this), {
					action: Actions.updateStatus,
					objectReference: { render: 'Criando ArrayBuffer do arquivo, por favor aguarde...' }
				});
				const fileArrayBuffer: ArrayBuffer = await objectReference.arrayBuffer();
				console.log(fileArrayBuffer);

				childPostMessage<UpdateOptions>(postMessage.bind(this), {
					action: Actions.updateStatus,
					objectReference: {
						render:
							'Convertendo ArrayBuffer do arquivo excel no objeto Worksheet, por favor aguarde...'
					}
				});

				const workbook: WorkBook = read(fileArrayBuffer, {
					dense: true,
					cellHTML: false,
					cellFormula: false,
					raw: false,
					type: 'buffer'
				});

				const firstSheetName: string = workbook.SheetNames[0] as string;
				const worksheet: WorkSheet = workbook.Sheets[firstSheetName] as WorkSheet;
				childPostMessage(postMessage.bind(this), {
					action: Actions.sendworkSheet,
					objectReference: worksheet
				});
			}
			return;
		}

		if (action === Actions.requestedContent) {
			const { objectReference }: iWorkerMessage<worksheetInfo> = e.data;

			if (objectReference !== undefined) {
				const { worksheetBase } = objectReference;
				if (worksheetBase === undefined) {
					childPostMessage<UpdateOptions>(postMessage.bind(this), {
						action: Actions.updateStatus,
						objectReference: {
							render: 'Objeto worksheet indefinido (undefined)...',
							autoClose: 3000,
							hideProgressBar: false,
							draggable: true,
							closeButton: true,
							isLoading: false,
							type: 'error'
						}
					});
					return;
				}

				const { worksheetRange, readCounter } = objectReference;

				const truncate: boolean = true;
				const readRange: Range = {
					s: {
						r: worksheetRange.s.r + (truncate ? 0 : readCounter),
						c: worksheetRange.s.c
					},
					e: { r: 20 + (truncate ? 0 : readCounter), c: worksheetRange.e.c }
				};

				childPostMessage<UpdateOptions>(postMessage.bind(this), {
					action: Actions.updateStatus,
					objectReference: {
						render: 'Convertendo objeto Worksheet em json, por favor aguarde...'
					}
				});

				const json: Array<any> = utils.sheet_to_json(worksheetBase, {
					range: readRange,
					blankrows: false,
					raw: false,
					rawNumbers: false,
					defval: ''
				});

				childPostMessage<Array<any>>(postMessage.bind(this), {
					action: Actions.sendContent,
					objectReference: json
				});

				return;
			}
			childPostMessage(postMessage.bind(this), {
				action: Actions.notifyError,
				objectReference: { msg: 'objetos inexistentes...' }
			});
			return;
		}
	} catch (error) {
		childPostMessage(postMessage.bind(this), {
			action: Actions.notifyError,
			objectReference: { msg: 'algum erro aconteceu...', error }
		});
	}
});
