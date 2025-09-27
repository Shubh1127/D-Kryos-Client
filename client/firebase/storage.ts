import { storage } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Upload file
export const uploadFile = async (filePath: string, file: File) => {
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// Download URL
export const getFileURL = async (filePath: string) => {
  const storageRef = ref(storage, filePath);
  return await getDownloadURL(storageRef);
};
