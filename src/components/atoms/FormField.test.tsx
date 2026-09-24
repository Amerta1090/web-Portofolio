import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FormField } from "./FormField";
import { Input } from "./Input";

describe("FormField", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders label linked to the control and the control itself", () => {
    render(
      <FormField id="name" label="Name">
        <Input id="name" />
      </FormField>,
    );
    expect(screen.getByLabelText("Name")).toBeInstanceOf(HTMLInputElement);
  });

  it("renders no label when label is omitted", () => {
    render(
      <FormField id="name">
        <Input id="name" />
      </FormField>,
    );
    expect(screen.queryByText("Name")).toBeNull();
    expect(screen.getByRole("textbox")).toBeInstanceOf(HTMLInputElement);
  });

  it("renders error in role=alert with stable id", () => {
    render(
      <FormField id="name" label="Name" error="Name is required">
        <Input id="name" aria-describedby="name-error" />
      </FormField>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Name is required");
    expect(alert).toHaveAttribute("id", "name-error");
    expect(alert.className).toContain("text-danger");
  });

  it("renders hint when no error is present", () => {
    render(
      <FormField id="email" label="Email" hint="We never share your email">
        <Input id="email" />
      </FormField>,
    );
    expect(screen.getByText("We never share your email")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("hides hint when error is present", () => {
    render(
      <FormField id="email" label="Email" hint="We never share your email" error="Invalid email">
        <Input id="email" />
      </FormField>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
    expect(screen.queryByText("We never share your email")).toBeNull();
  });

  it("renders label visually hidden when srOnly", () => {
    render(
      <FormField id="search" label="Search skills" srOnly>
        <Input id="search" />
      </FormField>,
    );
    expect(screen.getByText("Search skills").className).toContain("sr-only");
  });

  it("forwards ref and merges className", () => {
    const { container } = render(
      <FormField id="name" label="Name" className="custom-field">
        <Input id="name" />
      </FormField>,
    );
    const wrapper = container.querySelector(".custom-field");
    expect(wrapper).toBeTruthy();
  });

  it("renders arbitrary children (e.g. Textarea)", () => {
    render(
      <FormField id="message" label="Message">
        <textarea id="message" />
      </FormField>,
    );
    expect(screen.getByLabelText("Message").tagName).toBe("TEXTAREA");
  });
});
