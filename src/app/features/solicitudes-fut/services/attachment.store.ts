import { Injectable } from '@angular/core';
export interface StoredAttachment {
    id: number;
    blob: Blob;
    name: string;
    type: string;
    size: number;
}
/** Guarda los archivos adjuntos (PDF/imagen) en IndexedDB del navegador, ligados al id de la solicitud. */
@Injectable({ providedIn: 'root' })
export class AttachmentStore {
    private open(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('Este navegador no permite guardar archivos adjuntos.'));
                return;
            }
            const req = indexedDB.open('fut-files', 1);
            req.onupgradeneeded = () => req.result.createObjectStore('files', { keyPath: 'id' });
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(new Error('No se pudo abrir el almacén de archivos.'));
        });
    }
    async save(id: number, file: File): Promise<void> {
        const db = await this.open();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('files', 'readwrite');
            tx.objectStore('files').put({ id, blob: file, name: file.name, type: file.type, size: file.size } as StoredAttachment);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('No se pudo guardar el archivo adjunto.'));
        });
        db.close();
    }
    async get(id: number): Promise<StoredAttachment | null> {
        const db = await this.open();
        const result = await new Promise<StoredAttachment | null>((resolve, reject) => {
            const req = db.transaction('files', 'readonly').objectStore('files').get(id);
            req.onsuccess = () => resolve((req.result as StoredAttachment) || null);
            req.onerror = () => reject(new Error('No se pudo leer el archivo adjunto.'));
        });
        db.close();
        return result;
    }
}

