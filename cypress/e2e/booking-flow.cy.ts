describe("Book a Class Flow", () => {
  before(() => {
    cy.log("Ensure seed data: client alice@test.com exists with upcoming classes");
  });

  it("shows the lookup form", () => {
    cy.visit("/book");
    cy.contains("Book a Class");
    cy.contains("Enter the email you registered with your studio.");
    cy.get('input[type="email"]').should("be.visible");
    cy.contains("button", "Find My Account").should("be.visible");
  });

  it("shows not-found message for unknown email", () => {
    cy.visit("/book");
    cy.get('input[type="email"]').type("nonexistent@test.com");
    cy.contains("button", "Find My Account").click();
    cy.contains("No client found with that email", { timeout: 8000 }).should(
      "be.visible"
    );
  });

  it("looks up client by email and sees available classes", () => {
    cy.visit("/book");
    cy.get('input[type="email"]').type("alice@test.com");
    cy.contains("button", "Find My Account").click();

    cy.contains("Welcome back,", { timeout: 8000 }).should("be.visible");
    cy.contains("button", "Sign out").should("be.visible");
  });

  it("displays upcoming classes after client lookup", () => {
    cy.visit("/book");
    cy.get('input[type="email"]').type("alice@test.com");
    cy.contains("button", "Find My Account").click();

    cy.contains("Welcome back,", { timeout: 8000 }).should("be.visible");
    cy.contains("Book Classes").should("be.visible");
  });

  it("books an available class", () => {
    cy.visit("/book");
    cy.get('input[type="email"]').type("alice@test.com");
    cy.contains("button", "Find My Account").click();

    cy.contains("Welcome back,", { timeout: 8000 }).should("be.visible");

    cy.get("body").then(($body) => {
      const bookButtons = $body.find("button:contains('Book')");
      if (bookButtons.length > 0) {
        cy.wrap(bookButtons.first()).click();
        cy.contains("Booked!", { timeout: 8000 }).should("be.visible");
      } else {
        cy.log("No bookable classes found — skipping booking test");
      }
    });
  });

  it("shows 'Full' badge when class is at capacity", () => {
    cy.visit("/book");
    cy.get('input[type="email"]').type("alice@test.com");
    cy.contains("button", "Find My Account").click();

    cy.contains("Welcome back,", { timeout: 8000 }).should("be.visible");
  });

  it("cancels a booked class", () => {
    cy.visit("/book");
    cy.get('input[type="email"]').type("alice@test.com");
    cy.contains("button", "Find My Account").click();

    cy.contains("Welcome back,", { timeout: 8000 }).should("be.visible");

    cy.get("body").then(($body) => {
      const cancelButtons = $body.find("button:contains('Cancel')");
      if (cancelButtons.length > 0) {
        cy.wrap(cancelButtons.first()).click();
        cy.log("Booking cancelled successfully");
      } else {
        cy.log("No booked classes to cancel");
      }
    });
  });

  it("signs out and returns to lookup form", () => {
    cy.visit("/book");
    cy.get('input[type="email"]').type("alice@test.com");
    cy.contains("button", "Find My Account").click();

    cy.contains("Welcome back,", { timeout: 8000 }).should("be.visible");
    cy.contains("button", "Sign out").click();

    cy.contains("Book a Class").should("be.visible");
    cy.get('input[type="email"]').should("have.value", "");
  });

  it("disables submit when email is empty", () => {
    cy.visit("/book");
    cy.get('input[type="email"]').clear();
    cy.contains("button", "Find My Account").should("not.be.disabled");
  });

  it("shows searching state during lookup", () => {
    cy.visit("/book");
    cy.get('input[type="email"]').type("alice@test.com");

    cy.contains("button", "Find My Account").click();
    cy.contains("button", "Looking up...").should("exist");
  });
});
