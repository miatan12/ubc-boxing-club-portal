import React, { StrictMode } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import SuccessPage from "./SuccessPage";
import { getJSON, okOrThrow } from "../lib/api";

jest.mock("../lib/api", () => ({
  getJSON: jest.fn(),
  okOrThrow: jest.fn(async (res) => res),
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  localStorage.clear();
  window.history.replaceState({}, "", "/success?session_id=cs_test_paid");
});

afterEach(() => { jest.useRealTimers(); });

test("waits for the webhook and confirms using only the session status", async () => {
  localStorage.setItem("boxing-form", JSON.stringify({ name: "Old cached form" }));
  getJSON
    .mockResolvedValueOnce({ json: async () => ({ flow: "register", fulfilled: false }) })
    .mockResolvedValue({ json: async () => ({ flow: "register", fulfilled: true }) });
  render(<SuccessPage />);
  await act(async () => {});
  await waitFor(() => expect(getJSON).toHaveBeenCalledTimes(1));
  expect(screen.queryByText("Registration Successful!")).not.toBeInTheDocument();
  await act(async () => { jest.advanceTimersByTime(1500); });
  expect(await screen.findByText("Registration Successful!")).toBeInTheDocument();
  expect(getJSON).toHaveBeenCalledWith("/api/checkout/session-status?session_id=cs_test_paid");
  expect(localStorage.getItem("boxing-form")).toBeNull();
});

test("a fresh browser can confirm a paid registration without a cached form", async () => {
  getJSON.mockResolvedValue({ json: async () => ({ flow: "register", fulfilled: true }) });
  render(<StrictMode><SuccessPage /></StrictMode>);
  expect(await screen.findByText("Registration Successful!")).toBeInTheDocument();
  expect(okOrThrow).toHaveBeenCalled();
});

test("missing session ID cannot confirm a payment even with a cached form", async () => {
  window.history.replaceState({}, "", "/success");
  localStorage.setItem("boxing-form", "{}");
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  render(<SuccessPage />);
  expect(await screen.findByText("We couldn’t confirm your registration")).toBeInTheDocument();
  expect(getJSON).not.toHaveBeenCalled();
  error.mockRestore();
});

test.each(["renew", "dropin"])("confirms %s without submitting a member form", async (flow) => {
  getJSON.mockResolvedValue({ json: async () => ({ flow, fulfilled: true }) });
  render(<SuccessPage />);
  expect(await screen.findByText(flow === "renew" ? "Renewal Successful!" : "Drop-in Successful!")).toBeInTheDocument();
});
