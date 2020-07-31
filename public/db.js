let db;
// create a new db request for a "budget" database.
const request = window.indexedDB.open("budget", 1);
request.onupgradeneeded = function (event) {
  // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  const budgetStore = db.createObjectStore("budget", { autoIncrement: true });
  budgetStore.createIndex("pendingIndex", "pending");
};
request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};
request.onerror = function (event) {
  // log error here
  console.log(
    "There has been an error with retrieving your data: " + request.error
  );
};
function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["budget"], "readwrite");
  // access your pending object store
  const budgetStore = transaction.objectStore("budget");
  // add record to your store with add method.
  budgetStore.add(record);
}
function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["budget"], "readwrite");
  const budgetStore = transaction.objectStore("budget");
  // const pendingIndex = budgetStore.index("pendingIndex")
  // console.log("checkDatabase -> pendingIndex", pendingIndex)
  const getRequest = budgetStore.getAll();
  // getRequest.onsuccess = () => {
  //   console.log(getRequest.result);
  // };
  // access your pending object store
  // get all records from store and set to a variable
  getRequest.onsuccess = function () {
    if (getRequest.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getRequest.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          const transaction = db.transaction(["budget"], "readwrite");
          // access your pending object store
          const budgetStore = transaction.objectStore("budget");
          // clear all items in your store
          budgetStore.clear();
        });
    }
  };
}
// listen for app coming back online
window.addEventListener("online", checkDatabase);