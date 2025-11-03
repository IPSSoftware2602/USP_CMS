const authServerConfig = (server) => {
  server.post(
    "/register",
    (schema, request) => {
      const requestData = JSON.parse(request.requestBody);
      const { email, password } = requestData;

      const existingUser = schema.users.findBy({ email });
      if (existingUser) {
        return new Response(400, {}, { error: "Email is already registered" });
      }

      const user = schema.users.create({
        email,
        password,
      });

      const token = "fake-token";

      return {
        token,
        user: user.attrs,
      };
    }
    // { timing: 2000 }
  );

  server.post(
    "/login",
    (schema, request) => {
      const requestData = JSON.parse(request.requestBody);
      const { username, email, password_hash, password } = requestData;

      const loginField = username || email;
      const loginPassword = password_hash || password;

      if (!loginField || !loginPassword) {
        return new Response(
          422,
          {},
          { error: 422, messages: { error: "Validation failed" }, status: 422 }
        );
      }

      const user = schema.users.findBy({ email: loginField });

      if (!user) {
        return new Response(
          404,
          {},
          { error: 404, messages: { error: "User not found" }, status: 404 }
        );
      }

      if (user.attrs.password !== loginPassword) {
        return new Response(
          400,
          {},
          { error: 400, messages: { error: "Invalid username or password" }, status: 400 }
        );
      }

      const token = "fake-token";

      return {
        token,
        user: user.attrs,
      };
    }
    // { timing: 2000 }
  );

  server.post("/logout", () => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (error) {
      console.log('Storage clear error (normal in server environment):', error.message);
    }
    
    return new Response(200, {}, { 
      message: "Logout successful",
      clearStorage: true
    });
  });
};

export default authServerConfig;