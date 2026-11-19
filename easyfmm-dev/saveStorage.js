// saveStorage.js - IndexedDB 기반 대용량 세이브 스토리지 (동기 캐시 + localStorage 자동 마이그레이션)
(function (global) {
    const DB_NAME = 'easyfmm_storage';
    const DB_VERSION = 1;
    const STORE_NAME = 'saves';
    const SAVE_KEY_PATTERN = /^(fm_save_|footballManagerSave_slot|worldcup_save_)/;

    const SaveStorage = {
        _db: null,
        _idbAvailable: false,
        _initialized: false,
        _initPromise: null,
        _cache: new Map(),

        isSaveKey(key) {
            return typeof key === 'string' && SAVE_KEY_PATTERN.test(key);
        },

        init() {
            if (this._initPromise) return this._initPromise;
            this._initPromise = this._initInternal().catch((err) => {
                console.warn('[SaveStorage] IndexedDB 초기화 실패, localStorage 폴백 사용:', err);
                this._idbAvailable = false;
                this._initialized = true;
            });
            return this._initPromise;
        },

        async _initInternal() {
            if (typeof indexedDB === 'undefined') {
                this._idbAvailable = false;
                this._initialized = true;
                return;
            }

            const db = await this._openDB();
            this._db = db;
            this._idbAvailable = true;

            db.onversionchange = () => {
                db.close();
                this._db = null;
            };

            await this._loadAllIntoCache(db);
            await this._migrateFromLocalStorage(db);
            this._initialized = true;
        },

        _openDB() {
            return new Promise((resolve, reject) => {
                try {
                    const request = indexedDB.open(DB_NAME, DB_VERSION);
                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains(STORE_NAME)) {
                            db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                        }
                    };
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error || new Error('IndexedDB open error'));
                    request.onblocked = () => reject(new Error('IndexedDB open blocked'));
                } catch (e) {
                    reject(e);
                }
            });
        },

        _loadAllIntoCache(db) {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.openCursor();

                req.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const record = cursor.value;
                        if (record && typeof record.key === 'string') {
                            this._cache.set(record.key, record.value);
                        }
                        cursor.continue();
                    }
                };
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error || new Error('IndexedDB read error'));
            });
        },

        _migrateFromLocalStorage(db) {
            if (typeof localStorage === 'undefined') return Promise.resolve();

            const keysToMigrate = [];
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (this.isSaveKey(key)) {
                        keysToMigrate.push(key);
                    }
                }
            } catch (e) {
                return Promise.resolve();
            }

            if (keysToMigrate.length === 0) return Promise.resolve();

            const entries = [];
            keysToMigrate.forEach((key) => {
                try {
                    const val = localStorage.getItem(key);
                    if (val !== null) {
                        entries.push({ key, value: val });
                    }
                } catch (e) {
                    // ignore
                }
            });

            if (entries.length === 0) return Promise.resolve();

            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);

                entries.forEach(({ key, value }) => {
                    if (!this._cache.has(key)) {
                        this._cache.set(key, value);
                        store.put({ key, value });
                    }
                });

                tx.oncomplete = () => {
                    // IndexedDB 커밋 완료 후 localStorage 공간 회수
                    entries.forEach(({ key }) => {
                        try {
                            localStorage.removeItem(key);
                        } catch (e) {
                            // ignore
                        }
                    });
                    console.log(`[SaveStorage] localStorage에서 ${entries.length}개 세이브를 IndexedDB로 마이그레이션 완료`);
                    resolve();
                };

                tx.onerror = () => {
                    console.warn('[SaveStorage] 마이그레이션 트랜잭션 오류:', tx.error);
                    resolve();
                };
            });
        },

        async _ensureDB() {
            await this.init();
            if (!this._idbAvailable) return null;
            if (!this._db) {
                try {
                    this._db = await this._openDB();
                } catch (e) {
                    this._idbAvailable = false;
                    return null;
                }
            }
            return this._db;
        },

        getItem(key) {
            if (this._cache.has(key)) {
                return this._cache.get(key);
            }
            try {
                return localStorage.getItem(key);
            } catch (e) {
                return null;
            }
        },

        async setItem(key, value) {
            const strVal = String(value);
            const hadPrev = this._cache.has(key);
            const prevVal = this._cache.get(key);
            this._cache.set(key, strVal);

            try {
                const db = await this._ensureDB();
                if (db) {
                    await new Promise((resolve, reject) => {
                        const tx = db.transaction(STORE_NAME, 'readwrite');
                        const store = tx.objectStore(STORE_NAME);
                        store.put({ key, value: strVal });
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => reject(tx.error || new Error('IndexedDB write error'));
                        tx.onabort = () => reject(tx.error || new Error('IndexedDB write aborted'));
                    });

                    try {
                        if (localStorage.getItem(key) !== null) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        // ignore
                    }
                    return true;
                }

                // IndexedDB 미지원 시 localStorage 폴백
                localStorage.setItem(key, strVal);
                return true;
            } catch (err) {
                if (hadPrev) {
                    this._cache.set(key, prevVal);
                } else {
                    this._cache.delete(key);
                }
                throw err;
            }
        },

        async removeItem(key) {
            this._cache.delete(key);
            try {
                localStorage.removeItem(key);
            } catch (e) {
                // ignore
            }

            const db = await this._ensureDB();
            if (db) {
                await new Promise((resolve, reject) => {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    store.delete(key);
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error || new Error('IndexedDB delete error'));
                });
            }
        }
    };

    global.SaveStorage = SaveStorage;
})(window);
