
import { API_URL } from "./config";

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid email or password");
  }

  return response.json();
}

export type RegisterResponse = {
  id: number;
  email: string;
};

export async function registerUser(
  email: string,
  password: string
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 409) {
    throw new Error("This email address is already registered.");
  }

  if (!response.ok) {
    throw new Error("Registration failed. Please check your details.");
  }

  return response.json();
}
