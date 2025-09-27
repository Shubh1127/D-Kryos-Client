import { auth } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, updateEmail, updatePassword } from "firebase/auth";

// Signup
export const registerUser = async (email: string, password: string, displayName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  return userCredential.user;
};

// Login
export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Logout
export const logoutUser = async () => {
  await signOut(auth);
};

// Update profile
export const updateUserProfile = async (displayName?: string, email?: string, password?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  if (displayName) await updateProfile(user, { displayName });
  if (email) await updateEmail(user, email);
  if (password) await updatePassword(user, password);

  return user;
};
