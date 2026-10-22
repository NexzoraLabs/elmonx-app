import { File } from 'expo-file-system';

/**
 * Appends a local file (e.g. an expo-image-picker `uri`) to a multipart FormData.
 *
 * Expo SDK 57 replaces global `fetch` with `expo/fetch`, which no longer accepts React Native's
 * `{ uri, name, type }` file descriptor ("Unsupported FormDataPart implementation"). An
 * expo-file-system `File` is supported: fetch reads its bytes, and the part's filename and
 * content-type come from the file itself (the backend's multer filter needs that mimetype).
 */
export function appendLocalFile(form: FormData, field: string, uri: string) {
  form.append(field, new File(uri) as unknown as Blob);
}
