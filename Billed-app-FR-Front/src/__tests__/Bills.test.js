/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      const windowIcon = await waitFor(() => screen.getByTestId("icon-window"));
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = await waitFor(() =>
        screen
          .getAllByText(
            /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
          )
          .map((a) => a.innerHTML)
      );
      const chronologicalOrder = (a, b) => (a < b ? -1 : 1);
      const datesSorted = [...dates].sort(chronologicalOrder);
      expect(dates).toEqual(datesSorted);
    });

    test("Then bills should be fetched from mock API GET", async () => {
      onNavigate(ROUTES_PATH.Bills);
      const eyeIcon = await waitFor(() => screen.getAllByTestId("icon-eye"));
      expect(eyeIcon).toBeTruthy();
    });
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
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
      document.body.appendChild(root);
      router();
    });
    test("Then bills fetch from API should fail with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await waitFor(() => screen.getByText(/Erreur 404/));
      expect(message).toBeTruthy();
    });

    test("Then bills fetch from API should fail with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await waitFor(() => screen.getByText(/Erreur 500/));
      expect(message).toBeTruthy();
    });
  });

  describe("When I click the New Bill button on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });
    test("Then it should redirect to New Bill Page", async () => {
      window.onNavigate(ROUTES_PATH.Bills);

      const handleClickNewBill = jest.fn(Bills.handleClickNewBill);
      const newBillBtn = await waitFor(() =>
        screen.getByTestId("btn-new-bill")
      );

      newBillBtn.addEventListener("click", handleClickNewBill);
      fireEvent.click(newBillBtn);

      const submitBtn = await waitFor(() =>
        document.getElementById("btn-send-bill")
      );

      expect(handleClickNewBill).toHaveBeenCalled();
      expect(submitBtn).toBeTruthy();
    });
  });

  describe("When I click the eye icon of a bill", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });
    test("Then a modal with the receipt image should be displayed", async () => {
      window.onNavigate(ROUTES_PATH.Bills);

      $.fn.modal = jest.fn();
      const handleClickIconEye = jest.fn(Bills.handleClickIconEye);
      const eyeIcons = await waitFor(() => screen.getAllByTestId("icon-eye"));

      const lastEyeIcon = eyeIcons.reverse()[0];

      lastEyeIcon.addEventListener("click", handleClickIconEye);
      fireEvent.click(lastEyeIcon);

      const headerText = await waitFor(() => screen.getByText("Justificatif"));

      expect(handleClickIconEye).toHaveBeenCalled();
      expect(headerText).toBeTruthy();
    });
  });
});
