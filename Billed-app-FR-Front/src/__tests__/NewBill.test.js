/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "e@e",
      })
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);

    router();
    window.onNavigate(ROUTES_PATH.NewBill);
    window.alert = jest.fn();
  });

  describe("When I am on NewBill Page", () => {
    test("Then a header text should be displayed", () => {
      const headerText = screen.getByText("Envoyer une note de frais");
      expect(headerText).toBeTruthy();
    });

    test("Then a submit button should be displayed", () => {
      const submitBtn = document.getElementById("btn-send-bill");
      expect(submitBtn).toBeTruthy();
    });

    test("Then a new bill form should be displayed", () => {
      const newBillForm = screen.getByTestId("form-new-bill");
      expect(newBillForm).toBeTruthy();
    });

    describe("When I upload a file with a supported format on NewBill Page", () => {
      test("Then the file should be uploaded", async () => {
        const fileInput = screen.getByTestId("file");
        const testFile = new File(["testFile"], "test.png", {
          type: "image/png",
        });

        await waitFor(() => userEvent.upload(fileInput, testFile));

        expect(fileInput.files[0]).toStrictEqual(testFile);
        expect(fileInput.files.item(0)).toStrictEqual(testFile);
        expect(fileInput.files).toHaveLength(1);
      });
    });
  });

  describe("When I upload a file with an unsupported format on NewBill Page", () => {
    test("Then an alert with an error message should be displayed", async () => {
      const fileInput = screen.getByTestId("file");
      const testFile = new File(["testFile"], "test.txt", {
        type: "text/txt",
      });

      await waitFor(() => userEvent.upload(fileInput, testFile));

      expect(fileInput.files[0]).toStrictEqual(testFile);
      expect(fileInput.files.item(0)).toStrictEqual(testFile);
      expect(fileInput.files).toHaveLength(1);
      expect(window.alert).toHaveBeenCalledWith(
        "Invalid file format. Supported file formats : .jpg .jpeg .png."
      );
    });
  });

  describe("When I submit a valid form on New Bill page", () => {
    test("Then it should redirect to Bills page", async () => {
      const expenseTypeInput = screen.getByTestId("expense-type");
      const expenseNameInput = screen.getByTestId("expense-name");
      const datePickerInput = screen.getByTestId("datepicker");
      const amountInput = screen.getByTestId("amount");
      const vatInput = screen.getByTestId("vat");
      const pctInput = screen.getByTestId("pct");
      const commentaryInput = screen.getByTestId("commentary");
      const fileInput = screen.getByTestId("file");
      const testFile = new File(["testFile"], "test.png", {
        type: "image/png",
      });

      expenseTypeInput.value = "Restaurants et bars";
      expenseNameInput.value = "Test Restaurant";
      datePickerInput.value = "2023-01-01";
      amountInput.value = "50";
      vatInput.value = "70";
      pctInput.value = "20";
      commentaryInput.value = "No comment";

      await waitFor(() => userEvent.upload(fileInput, testFile));

      const submitBtn = await waitFor(() =>
        document.getElementById("btn-send-bill")
      );
      userEvent.click(submitBtn);

      const newBillBtn = await waitFor(() =>
        screen.getByTestId("btn-new-bill")
      );
      const billHeaderText = await waitFor(() =>
        screen.getByText("Mes notes de frais")
      );

      expect(newBillBtn).toBeTruthy();
      expect(billHeaderText).toBeTruthy();
    });
  });
});
