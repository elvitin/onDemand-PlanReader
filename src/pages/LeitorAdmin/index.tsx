import {
	ChangeEvent,
	Dispatch,
	Fragment,
	SetStateAction,
	useEffect,
	useRef,
	useState
} from 'react';
import { Id, toast, ToastContainer, UpdateOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import { Range, utils, WorkSheet } from 'xlsx';
import './index.css';
import { Actions, FileType, iWorkerMessage, worksheetInfo } from './interfacesAndTypes';
import { parentPostMessage } from './workerMiddleware';
let file: FileType;
let worksheetBase: WorkSheet;
let readCounter: number = 0;
let worksheetRange: Range = { s: { r: -1, c: -1 }, e: { r: -1, c: -1 } };
let currentOperationID: Id;
const worker: Worker = new Worker(new URL('./worker.ts', import.meta.url), {
	type: 'module'
});

export function LeitorAdmin(): JSX.Element {
	const [headerState, setHeaderState]: [Array<string>, Dispatch<SetStateAction<Array<string>>>] =
		useState<Array<string>>([]);

	const [contentState, setContentState] = useState<Array<{}>>([]);
	function getHeaders(json: Array<any>): Array<string> {
		if (json.length > 0) {
			return Object.keys(json[0]).map(item => String(item));
		}
		return [];
	}

	useEffect(() => {
		setToastState({
			render: 'Renderização finalizada!',
			autoClose: 3000,
			hideProgressBar: false,
			draggable: true,
			closeButton: true,
			closeOnClick: true,
			isLoading: false,
			type: 'success'
		});
		setLinkFileBtnState(false);
		setMoreContentBtnState(false);
	}, [contentState]);
	function linkFile(e: ChangeEvent<HTMLInputElement>): void {
		if (e.target.files !== null) {
			file = e.target.files[0];
		}
	}

	worker.onmessage = (e: MessageEvent<iWorkerMessage<any>>): void => {
		const { action } = e.data;
		if (action === Actions.worksheetReceived) {
			const { objectReference }: WorkSheet = e.data;
			if (objectReference === undefined && !objectReference) {
				return;
			}
			worksheetBase = objectReference;
			readCounter = 0;
			worksheetRange = utils.decode_range(worksheetBase?.['!ref'] || 'A1:A1');

			parentPostMessage<worksheetInfo>(worker, {
				action: Actions.requestContent,
				objectReference: { worksheetBase, readCounter, worksheetRange }
			});
			return;
		}

		if (action === Actions.contentReceived) {
			const { objectReference }: iWorkerMessage<Array<any>> = e.data;
			if (objectReference === undefined) {
				return;
			}

			setToastState({ render: 'Renderizando JSON na view, por favor, aguarde...' });
			const json = objectReference;
			const truncate: boolean = true;
			if (truncate) {
				//truncando objeto
				worksheetBase['!data']?.splice(1, json.length);
				worksheetRange.e.r -= 20;
				worksheetBase['!ref'] = utils.encode_range(worksheetRange);
				//truncando objeto
			}
			const headers: Array<string> = getHeaders(json);
			if (readCounter === 0) {
				setContentState([]);
				setHeaderState(headers);
			}
			readCounter += json.length;
			setContentState(old => [...old, ...json]);
		}

		if (action === Actions.receivedError) {
			const { objectReference } = e.data;
			console.error(objectReference);
			return;
		}

		if (action === Actions.updateStatus) {
			const { objectReference }: iWorkerMessage<UpdateOptions> = e.data;
			if (objectReference !== undefined) setToastState(objectReference);
		}
	};

	function createToast(msg: string = 'Processo iniciado') {
		currentOperationID = toast.loading(msg, {
			position: 'top-right',
			autoClose: false,
			hideProgressBar: true,
			closeOnClick: false,
			pauseOnHover: false,
			draggable: false,
			theme: 'colored',
			isLoading: true,
			pauseOnFocusLoss: false
		});
	}

	function setToastState(options: UpdateOptions) {
		toast.update(currentOperationID, options);
	}

	const inputFile = useRef<HTMLInputElement>(null);
	const [linkFileBtnState, setLinkFileBtnState] = useState<boolean>(false);
	const [moreContentBtnState, setMoreContentBtnState] = useState<boolean>(true);

	return (
		<Fragment>
			<ToastContainer />
			<input
				disabled={linkFileBtnState}
				ref={inputFile}
				id="file-upload"
				type="file"
				accept=".xlsx,.xls"
				onChange={e => {
					setLinkFileBtnState(true);
					setMoreContentBtnState(true);
					linkFile(e);
					createToast();
					parentPostMessage<FileType>(worker, {
						action: Actions.requestWorksheet,
						objectReference: file
					});
				}}
			/>
			<button
				onClick={e => {
					console.log(worksheetBase);
				}}>
				Show Worksheet
			</button>
			<button
				disabled={moreContentBtnState}
				onClick={e => {
					if (
						worksheetBase !== undefined &&
						worksheetBase['!data'] !== null &&
						worksheetBase['!data'] !== undefined &&
						worksheetBase['!data'].length <= 1 //considerando o truncate que mantém somente o cabeçalho
					) {
						toast.info('Não há mais dados para ler!');
						setMoreContentBtnState(true);
						return;
					}
					setMoreContentBtnState(true);
					createToast('Obtendo mais linhas, por favor aguarde...');
					parentPostMessage<worksheetInfo>(worker, {
						action: Actions.requestContent,
						objectReference: { worksheetBase, readCounter, worksheetRange }
					});
				}}>
				Carregar mais linhas.
			</button>
			<div className="container">
				<div className="table-wrapper">
					<table>
						<thead>
							<tr>
								{headerState.map(item => (
									<th key={crypto.randomUUID()}>{item}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{contentState.map(tr => {
								// debugger;
								return (
									<tr key={crypto.randomUUID()}>
										{Object.values(tr).map(td => {
											// debugger;
											return <td key={crypto.randomUUID()}>{String(td)}</td>;
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</Fragment>
	);
}
