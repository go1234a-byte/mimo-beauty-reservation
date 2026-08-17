const MIMO_UID_KEY = "mimo_uid";
const MIMO_LOGGED_IN_KEY = "mimo_logged_in";

function generateUid(): string {
  return `mimo-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function getOrCreateMimoUid(): string {
  let uid = localStorage.getItem(MIMO_UID_KEY);
  if (!uid) {
    uid = generateUid();
    localStorage.setItem(MIMO_UID_KEY, uid);
  }
  return uid;
}

export function isMimoLoggedIn(): boolean {
  return localStorage.getItem(MIMO_LOGGED_IN_KEY) === "1";
}

export function setMimoLoggedIn(loggedIn: boolean) {
  if (loggedIn) {
    localStorage.setItem(MIMO_LOGGED_IN_KEY, "1");
  } else {
    localStorage.removeItem(MIMO_LOGGED_IN_KEY);
  }
}
