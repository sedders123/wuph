const { expect, test } = require("@oclif/test");

describe("validate", () => {
  test
    .stdout()
    .command(["validate", "test/valid-posts/"])
    .it("exits with no warnings for valid posts", (ctx) => {
      expect(ctx.stdout).to.equal("");
    });

  test
    .stdout()
    .command(["validate", "test/invalid-posts/"])
    .exit(1)
    .it("exits with failure code for invalid posts");
});
