import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ShellHeader } from "./shell-header";

describe("shell header", () => {
  it("renders optional context copy next to the shared brand anchor", () => {
    const html = renderToStaticMarkup(
      <ShellHeader
        actions={<button type="button">Sign out</button>}
        context={
          <>
            <p>Workspace</p>
            <p>ui-review@example.com</p>
          </>
        }
      />,
    );

    expect(html).toContain("foxy");
    expect(html).toContain("Workspace");
    expect(html).toContain("ui-review@example.com");
    expect(html).toContain("Sign out");
  });
});
