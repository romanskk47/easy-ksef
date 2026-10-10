"use strict";
// Linux basic_text uses a shared fallback password, not an OS-protected secret.
function requireSecureStorage(storage,platform=process.platform){
 if(!storage.isEncryptionAvailable())throw new Error('STORAGE_UNAVAILABLE');
 if(platform==='linux'&&!['gnome_libsecret','kwallet','kwallet5','kwallet6'].includes(storage.getSelectedStorageBackend?.()))throw new Error('STORAGE_UNAVAILABLE');
}
module.exports={requireSecureStorage};
