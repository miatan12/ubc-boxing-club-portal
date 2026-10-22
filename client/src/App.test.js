import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

// Routing tests don't make requests to the payment/member API.
jest.mock("./lib/api", () => ({
  getJSON: jest.fn(),
  postJSON: jest.fn(),
  okOrThrow: jest.fn(),
  apiUrl: (path) => path,
}));

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});

test("home page links to the membership registration form", async () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /the ubc boxing club/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Register" }));
  expect(await screen.findByRole("heading", { name: "Membership Registration" })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/register");
});

test("unauthenticated visitors are redirected from the dashboard to login", async () => {
  window.history.replaceState({}, "", "/dashboard");
  render(<App />);
  expect(await screen.findByRole("heading", { name: /admin login/i })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/login");
});

test("unknown routes return to the home page", async () => {
  window.history.replaceState({}, "", "/does-not-exist");
  render(<App />);
  expect(await screen.findByRole("heading", { name: /the ubc boxing club/i })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/");
});
