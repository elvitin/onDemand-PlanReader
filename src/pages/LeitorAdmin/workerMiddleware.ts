import { iWorkerMessage } from './interfacesAndTypes';

/**
 * tipos copiados de
 * ../home/<youruser>/.vscode-server/bin/ee2b180d582a7f601fa6ecfdad8d9fd269ab1884/extensions/node_modules/typescript/lib/lib.webworker.d.ts
 * ../home/<youruser>/.vscode-server/bin/ee2b180d582a7f601fa6ecfdad8d9fd269ab1884/extensions/node_modules/typescript/lib/lib.dom.d.ts
 */
type postMessageFromWorker =
	| ((message: any, transfer?: Transferable[]) => void)
	| ((message: any, options?: StructuredSerializeOptions) => void);

export function parentPostMessage<T>(
	worker: Worker,
	message: iWorkerMessage<T>
): void {
	worker.postMessage(message);
}

export function childPostMessage<T>(
	postMessageInjectedFunction: postMessageFromWorker,
	message: iWorkerMessage<T>
): void {
	postMessageInjectedFunction(message);
}
