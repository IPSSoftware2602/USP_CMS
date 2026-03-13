const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

export function applyImpersonatedCmsSession(loginResponse) {
  const now = Date.now();
  const expireAt = now + SESSION_TIMEOUT;
  const userData = {
    token: loginResponse.token,
    user: loginResponse.userData,
    username: loginResponse.userData?.username || "",
    loginTime: new Date(now).toISOString(),
  };

  localStorage.setItem("user", JSON.stringify(userData));
  localStorage.setItem("expireAt", expireAt.toString());
  localStorage.setItem("expireAtDate", new Date(expireAt).toISOString());

  sessionStorage.setItem("token", loginResponse.token);
  sessionStorage.setItem("user", JSON.stringify(userData));
  sessionStorage.setItem("expireAt", expireAt.toString());
  sessionStorage.setItem("expireAtDate", new Date(expireAt).toISOString());
  sessionStorage.setItem("lastActive", now.toString());
  sessionStorage.setItem("lastActiveDate", new Date(now).toISOString());
}
