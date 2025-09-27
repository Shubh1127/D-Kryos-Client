import { db } from "./firebaseConfig";
import { doc, setDoc, getDoc, updateDoc, collection } from "firebase/firestore";

// Add employee
export const addEmployee = async (uid: string, data: any) => {
  await setDoc(doc(db, "employees", uid), data);
};

// Get employee
export const getEmployee = async (uid: string) => {
  const docRef = doc(db, "employees", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

// Update employee
export const updateEmployee = async (uid: string, data: any) => {
  await updateDoc(doc(db, "employees", uid), data);
};

// Example: transactions collection
export const logTransaction = async (transactionId: string, data: any) => {
  await setDoc(doc(db, "transactions", transactionId), data);
};
